# IDT 테이블 생성, 인터럽트, 예외 핸들러 등록

### IDT 테이블 생성

IDT 테이블은 IDT 게이트 디스크립터로 구성된다. 
IDT 게이트 디스크립터는 세그먼트 디스크립터와 구조적으로 다르지만, 타입 필드와 DPL, 그리고 P 필드의 위치가 같고 세그먼트 디스크립터 보다 필드가 간단하므로 더 쉽게 처리할 수 있다.

**IDT 게이트 디스크립터를 위한 자료구조와 매크로**

```
// 조합에 사용할 기본 매크로
#define IDT_TYPE_INTERRUPT    0x0e
#define IDT_TYPE_TRAP         0x0f
#define IDT_FLAGS_DPL0        0x00
#define IDT_FLAGS_DPL1        0x20
#define IDT_FLAGS_DPL2        0x40
#define IDT_FLAGS_DPL3        0x60
#define IDT_FLAGS_P           0x80
#define IDT_FLAGS_IST0        0
#define IDT_FLAGS_IST1        1

// 실제로 사용할 매크로
#define IDT_FLAGS_KERNEL      ( IDT_FLAGS_DPL0 | IDT_FLAGS_P ) // 인터럽트와 예외처리용 게이트 디스크립터의 플래그
// 애플리케이션이 소프트웨어 인터럽트(SWI)를 사용하여 커널 모드로
// 진입하는 데 사용할 게이트 디스크립터의 플래그, 시스템 콜용
#define IDT_FLAGS_USER        ( IDT_FLAGS_DPL3 | IDT_FLAGS_P )

// 1바이트로 정룔
#pragma pack( push, 1 )

// IDT 게이트 디스크립터 구조체
typedef struct kIDTEntryStruct
{
	WORD wLowerBaseAddress;
	WORD wSegmentSelector;
	// 3비트 IST, 5비트 0
	BYTE bIST;
	// 4비트 Type, 1비트 0, 2비트 DPL, 1비트 P
	BYTE bTypeAndFlags;
	WORD wMiddleBaseAddress;
	DWORD dwUpperBaseAddress;
	DWORD dwReserved;
} IDTENTRY;

#pragma pack( pop )
```

IDT 게이트 디스크립터를 설정하는 함수 역시 `kSetGDTEntry16()` 함수와 마찬가지로 16바이트로 구성된 자료구조에 값을 설정한다.

**IDT 게이트 디스크립터를 생성하는 코드**

```
void kSetIDTEntry(IDTENTRY* pstEntry, void* pvHandler, WORD wSelector, BYTE bIST, BYTE bFlags, BYTE bType)
{
	pstEntry->wLowerBaseAddress = (QWORD) pvHandler & 0xFFFF;
	pstEntry->wSegmentSelector = wSelector;
	pstEntry->bIST = bIST & 0x3;
	pstEntry->bTypeAndFlags = bType | bFlags;
	pstEntry->wMiddleBaseAddress = ((QWORD) pvHandler >> 16) & 0xFFFF;
	pstEntry->dwUpperBaseAddress = (QWORD) pvHandler >> 32;
	pstEntry->dwReserved = 0;
}
```

hIST 파라미터는 인터럽트나 예외가 발생했을 때, IST 중 어느 것을 사용할지를 설정하는 용도로 사용한다.
MINT64 OS에서는 1번 IST만 사용하므로 1로 설정한다.
bFlags와 bType은 권한(특권 레벨)과 게이트 타입을 설정하는 파라미터이다.
MINT64 OS의 모든 핸들러는 커널 레벨에서 동작하며 핸들러 수행 중에 인터럽트가 발생하는 것을 허락하지 않으므로 IDT_FLAGS_KERNEL 매크로와
IDT_TYPE_INTERRUPT 매크로를 각각 설정한다.

**IDT 테이블을 생성하는 코드와 임시 핸들러 코드**

```
void kInitializeIDTTables(void)
{
	IDTR* pstIDTR;
	IDTENTRY* pstEntry;
	int i;

	// IDTR의 시작 어드레스
	pstIDTR = (IDTR*) 0x1420A0;
	// IDT 테이블 정보 생성
	pstEntry = (IDTENTRY*) (0x1420A0 + sizeof(IDTR));
	pstIDTR->qwBaseAddress = (QWORD) pstEntry;
	pstIDTR->wLimit = 100 * sizeof(IDTENTRY) - 1;

	// 0 ~ 99 까지 벡터를 모두 DummyHadnler로 연결
	for (i = 0; i < 100; i++)
	{
		kSetIDTEntry(&(pstEntry[i]), kDummyHandler, 0x08, IDT_FLAGS_IST1, IDT_FLAGS_KERNEL, IDT_TYPE_INTERRUPT);
	}
}

// 임시 예외 인터럽트 핸들러
void kDummyHandler(void)
{
	kPrintString (0, 0, "=================================================================");
	kPrintString (0, 1, "            Dummy Interrupt Handler Called.");
	kPrintString (0, 2, "                    Interrupt Occur");
	kPrintString (0, 3, "=================================================================");

	while (1);
}
```

### IDT 테이블 로드

IDT 테이블을 프로세서에 로드하는 방법은 GDT 테이블을 로드하는 방법과 비슷하다.
x86 프로세서에는 **IDT 테이블에 대한 정보를 저장하는 IDTR 레지스터**가 있으며, 
`LIDT` 명령어를 사용하여 IDT 테이블에 대한 정보를 갖고 있는 자료구조의 어드레스를 넘겨줌으로써 프로세서에 로드할 수 있다.

**LIDT 명령러를 수행하는 어셈블리어 함수와 C 함수 선언 코드**

```
; IDTR 레지스터에 IDT 테이블을 설정
; PARAM: IDT 테이블의 정보를 저장하는 자료구조의 어드레스
kLoadIDTR:
	lidt [ rdi ]	; 파라미터 1(IDTR의 어드레스)를 프로세서에 로드하여 IDT 테이블을 설정
	ret

// C 함수 선언
void kLoadIDTR(QWORD qwIDTRAddress);
```

**함수를 통해 IDT 테이블을 생성하고 로드하는 코드**

```
void Main(void)
{
	kInitializeIDTTables();
	kLoadIDTR(0x1420A0); // IDT 테이블의 정보를 나타내는 자료구조(IDTR)의 어드레스
}
```

**수정 및 추가된 파일들**
[02.Kernel64/Source/AssemblyUtility.asm](https://github.com/KNero/os-study/blob/master/02.Kernel64/Source/AssemblyUtility.asm)
[02.Kernel64/Source/AssemblyUtility.h](https://github.com/KNero/os-study/blob/master/02.Kernel64/Source/AssemblyUtility.h)
[02.Kernel64/Source/Descriptor.c](https://github.com/KNero/os-study/blob/master/02.Kernel64/Source/Descriptor.c)
[02.Kernel64/Source/Descriptor.h](https://github.com/KNero/os-study/blob/master/02.Kernel64/Source/Descriptor.h)
[02.Kernel64/Source/Utility.c](https://github.com/KNero/os-study/blob/master/02.Kernel64/Source/Utility.c)
[02.Kernel64/Source/Utility.h](https://github.com/KNero/os-study/blob/master/02.Kernel64/Source/Utility.h)

이제 마지막으로 할 일은 C언어 엔트리 포인트를 수정하여 GDT, IDT, TSS 와 관련된 함수를 호출하는 것이다.
그리고 바로 예외를 발생시켜 핸들러가 정상적으로 동작하는지 확인하는 것이 가능한데 예외를 발생시키는 편리한 방법은 정수를 0으로 나누는 것이다.
이러한 특징을 이용하여 키를 입력받는 `while()` 루프 안에 숫자 0키가 입력되면 임시 변수를 0으로 나누어 예외가 발생하도록 했다.

```
#include "Types.h"
#include "Keyboard.h"
#include "Descriptor.h"

void kPrintString( int iX, int iY, const char* pcString );

// 아래 함수는 C 언어 커널의 시작 부분임
void Main( void )
{
	char vcTemp[2] = {0,};
	BYTE bFlags;
	BYTE bTemp;
	int i = 0;

	kPrintString(0, 10, "Switch To IA-32e Mode Success.");
	kPrintString(0, 11, "IA-32e C Language Kernel Start..............[Pass]");

	kPrintString(0, 12, "GDT Initialize And Switch For IA-32e Mode...[    ]");
	kInitializeGDTTableAndTSS();
	kLoadGDTR(GDTR_STARTADDRESS);
	kPrintString(45, 12, "Pass");

	kPrintString(0, 13, "TSS Segment Load............................[    ]");
	kLoadTR(GDT_TSSSEGMENT);
	kPrintString(45, 13, "Pass");

	kPrintString(0, 14, "IDT Initialize..............................[    ]");
	kInitializeIDTTables();
	kLoadIDTR(IDTR_STARTADDRESS);
	kPrintString(45, 14, "Pass");

	kPrintString(0, 12, "Keyboard Activate...........................[    ]");

	// 키보드를 활성화
	if (kActivateKeyboard() == TRUE)
	{
		kChangeKeyboardLED(FALSE, FALSE, FALSE);
		kPrintString(45, 12, "Pass");
	}
	else
	{
		kPrintString(45, 12, "Fail");
		while (1);
	}

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

					//0이 입력되면 변수를 0으로 나누어 Divide Error 예외(벡터 0번)를 발생시킴
					if (vcTemp[0] == '0')
					{
						// 아래 코드를 수행하면 Divide Error 예외가 발생하여 커널의 임시 핸들러가 수행됨
						bTemp = bTemp / 0;
					}
				}
			}
		}
	}
}

void kPrintString( int iX, int iY, const char* pcString )
{
	CHARACTER* pstScreen = ( CHARACTER* ) 0xB8000;
	int i;

	pstScreen += ( iY * 80 ) + iX;
	for ( i = 0; pcString[i] != 0; i++ )
	{
		pstScreen[i].bCharactor = pcString[i];
	}
}
```

이제 빌드를 하고 실행을 해보자.

![idt build](/contents/dev/2020/07/15/image/os-study-34-1.png)

여기서 키보드 `0`을 입력하면 `bTemp`의 값을 `0`으로 나누면서 아래와 같이 등록된 Dummy 핸들러가 호출된다.

![idt build](/contents/dev/2020/07/15/image/os-study-34-2.png)

여기서 사용한 임시 햄들러 함수가 왜 무한 루프를 실행하는지 궁금했는데 이유는 디버깅때문도 있지만, 임시 핸들러 함수는 이전 코드로 복귀할 능력이 없기 때문이다.
프로세서는 인터럽트나 예외가 발생했을 경우, 자신의 상태중 일부만 스택에 저장한다.
따라서 프로세서가 저장하지 않은 나머지 레지스터들은 OS가 처리해야 하는데, 임시 핸들러는 그러한 코드가 없기 때문에 복귀할 수 없는 것이다.

---

요즘 OS Study 가 지지 부진해졌다. 하고싶어서 시작한 공부였지만 회사에서 하는 개발과 거리가 있고 OS 공부를 하는 것이 재미는 있지만
워낙 어려운 분야라 책을 끝까지 하더라도 써먹을 수 있을까 하는 생각도 들었다. 그리고 한 번 한다고 얼마나 남을까 하는 생각도 했다.

하지만 그만할 수 없었던 이유는 한 번 그만 뒀었기 때문이었다. 지금 그만두면 했던 것들이 모두 안한게 된다는걸 경험했고 다시 반복하면 안된다는 생각.

그러다 문득 OS 공부중 내가 흥미가 있는 부분을 생각하고 나니 다시 할 수 있는 힘이 생겼다. `쓰레드, 스케쥴링, 프로세스 실행 등`
이렇게 다시 시작해 본다.