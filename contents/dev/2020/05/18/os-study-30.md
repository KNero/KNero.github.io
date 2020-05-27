# 스캔 코드

키보드를 활성화하고 키보드에서 전달된 데이터를 처리할 준비가 되었으니, 이제 데이터를 ASCII(American Standard Code for Information Intercharge)코드 형태로 변환하는 것이다. (영문자를 0~127 범위에 대응시키는 문자체계)
키보드는 ASCII 코드를 사용해서 데이터를 전달하지 않고 Scan Code를 전달하기 때문에 두 코드간에 변환이 필요하다.

스캔 코드는 키가 눌렸을 때(Down)와 떨어졌을 때(Up)의 값이 다르며, 일반적으로 떨어졌을 때의 키 값은 눌러졌을 때의 값에 최상위 비트(비트 7)을 1로 설정한 값과 같다.
최상위 비트를 1로 설정하는 것은 0x80을 더하는 것과 같으므로 눌러졌을 때의 키 값에 0x80을 더하는 방식으로 처리하면 된다.

**스캔 코드 매핑 테이블을 구성하는 엔트리**
```
typedef struct kKeyMappingEntryStruct
{
	// Shift 키나 Caps Lock 키와 조합되지 않는 ASCII 코드
	BYTE bNormalCode;

	// Shift 키나 Caps Lock 키와 조합된 ASCII 코드
	BYTE bCombinedCode;
} KEYMAPPINGENTRY;
```

기능 키들 중에 `Home`키나 `F1` 키는 별도로 할당된 ASCII 문자가 없기때문에 MINT64 OS에서는 이러한 키에 0x80 이상의 값을 할당하고, 매크로를 정의하여 애플리케이션에서 사용했다.

키값을 ASCII 문자로 변환하려면 Shift 키아 Caps Lock 키, Num Lock 키, 즉 조합키의 상태를 알고 있어야 한다. 
스캔 코드를 ASCII 코드로 매핑할 때 일반 키를 반환할지 혹은 조합키를 반환할지를 판단해야 하기 때문이다.
따라서 키보드 상태를 저장하는 자료구조를 정의하여 조합 키의 상태를 추가하겠다.

조합키 뿐만 아니라 스캔 코드 2개 이상이 조합된 확장키(Extended Key)도 처리해야 하는데 확장 키 중에서 Pause를 제외한 나머지 키들은 확장 키임을 알린 0xE0 코드를 먼저 전송하므로 0xE0를 수신했을 때 다음에 오는 키 값을 기다렸다가 처리하면 된다.

다른 확장 키와 달리 Pause는 `0xE1 0x1D 0x45` 처럼 3개의 코드가 조합되고 Up Code가 없으므로 0xE1이 수신되었을 때 Pause를 미리 처리하고 나머지 키 코드 2개를 무시하는 방법으로 처리할 수 있다. 따라서 확장 키가 수신되었는지 여부를 나타내는 필드와 Pause가 입력되었을 때 이후에 무시해야 하는 키 값을 저장하는 필드도 추가하겠다.

**키보드의 상태를 관리하는 자료구조**
```
typedef struct kKeyboardManagerStruct
{
	// 조합 키 정보
	BOOL bShiftDown;
	BOOL bCapsLockOn;
	BOOL bNumLockOn;
	BOOL bScrollLockOn;

	// 확장 키를 처리하기 위한 정보
	BOOL bExtendedCodeIn; // 확장키를 처리하기 위한 플래그
	int iSkipCountForPause; // Pause 키를 처리하기 위한 값. Pause 키는 세개의 코드로 구성되므로 첫 번째 키를 제외한 나머지 키를 무시하려고 추가.
}
```

**조합된 키 값을 사용해야 하는지 여부를 반환**
```
// 조합된 키 값을 사용해야 하는지 여부를 반환
BOOl kIsUseCombinedCode(BYTE bScanCode)
{
	BYTE bDownScanCode;
	BOOL bUseCombinedKey = FALSE;

	bDownScanCode = bScanCode & 0x7F;

	// 알파벳 키라면 Shift 키와 CapsLock의 영향을 받음
	if (kIsAlphabetScanCode(bDownScanCode) == TRUE)
	{
		// 만약 Shift 키와 Caps Lock 키 중에 하나만 눌러졌있으면 조합된 키를 되돌려 줌
		if (gs_stKeyboardManager.bShiftDown ^ gs_stKeyboardManager.bCapsLockOn)
		{
			bUseCombinedKey = TRUE;
		}
		else
		{
			bUseCombinedKey = FALSE;
		}
	}
	// 숫자와 기호 키라면 Shift 키의 영향을 받음
	else if (kIsNumberOrSymbolScanCode(bDownScanCode) == TRUE)
	{
		// Shift 키가 눌러져있으면 조합된 키를 되돌려 줌
		if (gs_stKeyboardManager.bShiftDown == TRUE)
		{
			bUseCombinedKey = TRUE;
		}
		else 
		{
			bUseCombinedKey = FALSE;
		}
	}
	// 숫자 패드 키라면 Num Lock 키의 영향을 받음
	// 0xE0만 제외하면 확장 키 코드와 숫자 패드의 코드가 겹치므로,
	// 확장 키 코드가 수신되지 않았을 때만처리 조합된 코드 사용
	else if ((kIsNumberPadScanCode(bDownScanCode) == TRUE) && (gs_stKeyboardManager.bExtendedCodeIn == FALSE))
	{
		// Num Lock 키가 눌러져있으면, 조합된 키를 되돌려 줌
		if (gs_stKeyboardManager.bNumLockOn == TRUE)
		{
			bUseCombinedKey = TRUE;
		}
		else 
		{
			bUseCombinedKey = FALSE;
		}
	}

	return bUseCombinedKey;
}

// 스캔 코드가 알파벳 범위인지 여부를 반환
BOOL kIsAlphabetScanCode(BYTE bScanCode)
{
	// 변환 테이블을 값을 직접 읽어서 알파벳 범위인지 확인
	if (('a' <= gs_vstKeyMappingTable[bScanCode].bNormalCode) && (gs_vstKeyMappingTable[bScanCode].bNormalCode <= 'z'))
	{
		return TRUE;
	}

	return FALSE;
}

// 숫자 또는 기호 범위인지 여부를 반환
BOOL kIsNumberOrSymbolScanCode(BYTE bScanCode)
{
	// 숫자 패드나 확장 키 범위를 제외한 범위(스캔 코드 2~35)에서 영문자가 아니면 숫자 또는 기호임
	if ((2 <= bScanCode) && (bScanCode <= 53) && (kIsAlphabetScanCode(bScanCode) == FALSE))
	{
		return TRUE;
	}
	else
	{
		return FALSE;
	}
}

// 숫자 패드 범위인지 여부를 반환
BOOL kIsNumberPadScanCode(BYTE bScanCode)
{
	// 숫자 패드는 스캔 코드의 71 ~ 83에 있음
	if ((71 <= bScanCode) && (bScanCode <= 83))
	{
		return TRUE;
	}

	return FALSE;
}
```

**조합 키의 상태를 갱신하는 함수의 코드**
```
void UpdateCombinationKeyStatusAndLED(BYTE bScanCode)
{
	BOOL bDown;
	BOOL bDownScanCode;
	BOOL bLEDStatusChanged = FALSE;

	// 눌림 또는 떨어짐 상태철, 최상위 비트(비트 7)가 1이면 키가 떨어졌음을 의미
	// 0이면 눌림을 의미
	if (bScanCode & 0x80)
	{
		bDown = FALSE;
		bDownScanCode = bScanCode & 0x7F;
	}
	else
	{
		bDown = TRUE;
		bDownScanCode = bScanCode;
	}

	// 조합키 검색
	// Shift 키의 스캔 코드(42 or 54)이면 Shift 키의 상태 갱신
	if ((bDownScanCode == 42) || (bDownScanCode == 54))
	{
		// KEYBOARDMANAGER 타입으로 선언된 키보드 상태를 관리하는 자료구조
		gs_stKeyboardManager.bShiftDown = bDown;
	}
	// Caps Lock 키의 스캔 코드(58)이면 Caps Lock의 상태 갱신하고 LED 상태 변경
	else if ((bDownScanCode == 58) && (bDown == TRUE))
	{
		gs_stKeyboardManager.bCapsLockOn ^= TRUE;
		bLEDStatusChanged = TRUE;
	}
	// Num Lock 키의 스캔 코드(69)이면 Num Lock의 상태를 갱신하고 LED 상태 변경
	else if ((bDownScanCode == 69) && (bDown == TRUE))
	{
		gs_stKeyboardManager.bNumLockOn ^= TRUE;
		bLEDStatusChanged = TRUE;
	}
	// Scroll Lock 키의 스캔 코드(70)이면 Scroll Lock의 상태를 갱신하고 LED 상태 변경
	else if ((bDownScanCode == 70) && (bDown == TRUE))
	{
		gs_stKeyboardManager.bScrollLockOn ^= TRUE;
		bLEDStatusChanged = TRUE;
	}

	// LED 상태가 변했으면 키보드로 커맨드를 전송하여 LED를 변경
	if (bLEDStatusChanged == TRUE)
	{
		kChangeKeyboardLED(gs_stKeyboardManager.bCapsLockOn, gs_stKeyboardManager.bNumLockOn, gs_stKeyboardManager.bScrollLockOn);
	}
}
```

**스캔 코드를 ASCII 코드로 변환하는 함수의 코드**
```
// 매크로 정의
// Pause 키를 처리하기 위해 무시해야 하는 나머지 스캔 코드의 수
#define KEY_SKIPCOUNTFORPAUSE 2

// 키 상태에 대한 플래그
#define KEY_FLAGS_UP          0x00
#define KEY_FLAGS_DOWN        0x01
#define KEY_FLAGS_EXTENDEDKEY 0x02

// 함수 코드
// 스캔 코드를 ASCII 코드로 변환
BOOL kConvertScanCodeToASCIICode(BYTE bScanCode, BYTE* pbASCIICode, BOOL* pbFlags)
{
	BOOL bUseCombinedKey;

	// 이전에 Pause 키가 수신되었다면, Pause의 남은 스캔 코드를 무시
	if (gs_stKeyboardManager.iSkipCountForPause > 0)
	{
		gs_stKeyboardManager.iSkipCountForPause--;
		return FALSE;
	}

	// Pause 카는 특별히 처리
	if (bScanCode == 0xE1)
	{
		*pbASCIICode = KEY_PAUSE;
		*pbFlags = KEY_FLAGS_DOWN;
		gs_stKeyboardManager.iSkipCountForPause = KEY_SKIPCOUNTFORPAUSE;
		return TRUE;
	}
	// 확장 키 코드가 들어왔을 때, 실제 키 값은 다음에 들어오므로 플래그 설정만 하고 종료
	else if (bScanCode == 0xE0)
	{
		gs_stKeyboardManager.bExtendedCodeIn = TRUE;
		return FALSE;
	}

	// 조합된 키를 반환해야 하는가?
	// 현재 입력된 스캔 코드와 조합 키의 상태를 이용하여 조합된 키로 변환해야 하는지 여부를 반환하는 함수
	bUseCombinedKey = kIsUseCombinedCode(bScanCode);

	// 키 값 설정
	if (bUseCombinedKey == TRUE)
	{
		*pbASCIICode = gs_vstKeyMappingTable[bScanCode & 0x7F].bCombinedCode;
	}
	else
	{
		*pbASCIICode = gs_vstKeyMappingTable[bScanCode & 0x7F].bNormalCode;
	}

	// 확장 키 유무 설정
	if (gs_stKeyboardManager.bExtendedCodeIn == TRUE)
	{
		*pbFlags = KEY_FLAGS_EXTENDEDKEY;
		gs_stKeyboardManager.bExtendedCodeIn = FALSE;
	}
	else
	{
		*pbFlags = 0;
	}

	// 눌러짐 또는 떨어짐 유무 설정
	if ((bScanCode & 0x80) == 0)
	{
		*pbFlags |= KEY_FLAGS_DOWN;
	}

	// 조합 키 눌림 또는 떨어짐 상태를 갱신
	// 현재 입력된 스캔 코드를 이용하여 조합 키 상태와 LED 상태를 갱신하는 함수
	UpdateCombinationKeyStatusAndLED(bScanCode);
	return TRUE;
}
}
```

지금까지 키보드 컨트롤러에서 스캔 코드를 얻는 방법과 스캔 코드를 ASCII 코드로 변경하는 방법을 알아보았다.
이제 입력된 키 값을 화면에 출력하는 아주 간단한 셸(Shell)을 구현해 보겠다.
셰이란 사용자에게서 명령을 받아 작업을 수행하는 프로그램으로 OS와 유저를 연결해주는 중요한 역할을 맡고 있다.

**입력된 키를 화면에 출력하는 간단한 셸 코드**
```
char vcTemp[2] = {0,};
BYTE bFlags;
BYTE bTemp;
int i = 0;

while (1)
{
	// 출려 버퍼(0x60)가 차있으면 스캔 코드를 읽을 수 있음
	if (kIsOutputBufferFull() == TRUE)
	{
		// 출력 버퍼(포트 0x60)에서 스캔 코드를 읽어서 저장
		bTemp = kGetKeyboardScanCode();

		// 스캔 코드를 ASCII 코드로 변환하는 함수를 호출하여 ASCII 코드와
		// 눌림 또는 떨어짐 정보를 변환
		if (kConvertScanCodeToASCIICode(bTemp, &(vcTemp[0]), &bFlags) == TRUE)
		{
			// 키가 눌러졌으면 키의 ASCII 코드 값을 화면에 출력
			if (bFlags & KEY_FLAGS_DOWN)
			{
				kPrintString(i++, 13, vcTemp);
			}
		}
	}
}
```