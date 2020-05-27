## 키보드 컨트롤러에서 키 값 읽기

키보드는 키가 눌리거나 떨어질 때마다 키 별로 할당된 특한 값을 키보드 컨트롤러로 전달하며, 이 값을 스캔 코드(Scan Code) 라고 한다.

별다른 커맨드를 키보드 컨트롤러로 보내지 않으면, 키보드 컨트롤러의 출력 버퍼에는 키보드 또는 마우스에서 수신된 데이터가 저장된다.
따라서 상태 레지스터를 읽어서 출력 버퍼에 데이터가 있는지 확인한 후, 데이터가 있다면 출력 버퍼를 읽어서 저장하면 된다.

**키보드 컨트롤러에서 키 값(Scan Code)를 읽는 코드**
```
BYTE kGetKeyboardScanCode(void)
{
	// 출력 버퍼(포트 0x60)에 데이터가 있을 때까지 대기
	while (kIsOutputBufferFull() == FALSE)
	{
		;
	}

	return kInPortByte(0x60); // 출력 버퍼(포트 0x60)에서 키 값(스캔 코드)를 읽어서 반환
}
```

## A20 게이트 활성화와 프로세스 리셋

![keyboard mouse relation](/contents/dev/2020/05/12/image/os-study-28-1.png)

위 그림에서 볼 수 있듯이, 키보드 컨트롤러의 출력 포트는 키보드와 마우스 외에 A20 게이트와 프로세서 리셋에 관련된 라인과도 연결되어 있다.
이것은 출력 포트의 비트를 1로 설정해서 A20 게이트를 활성화하거나 프로세서를 리셋할 수 있다는 것을 의미한다.

A20 게이트 비트와 프로세서 리셋 비트는 출력 포트의 비트 1과 비트 0에 있다. 그리고 키보드 컨트롤러의 출력 포트는 0xD0, 0xD1 커맨드로 접근할 수 있다.
A20 게이트를 활성화하는 방법과 프로세서를 리셋하는 방법은 출력 포트의 데이터를 0으로 설정하는 것만 다를 뿐, 나머지 코드는 같으므로 A20 게이트를 활성화하는 코드만 보자.

참고: [[OS Study] 키보드 컨트롤러의 구조와 기능](https://knero.github.io/#/contents?path=/contents/dev/2020/05/12/os-study-28.md&page=1)

**키보드 컨트롤러를 통해 A20 게이트를 활성화하는 코드**
```
void kEnableA20Gate(void)
{
	BYTE bOutputPortData;
	int i;

	// 컨트롤 레지스터(포트 0x64)에 키보드 컨트롤러의 출력 포트 값을 읽는 커맨드(0xD0) 전송
	kOutPortByte(0x64, 0xD0);

	//출력 포트의 데이터를 기다렸다가 읽음
	for (i = 0; i < 0xFFFF; i++)
	{
		//출력 버퍼(포트 0x60)가 차있으면 데이터를 읽을 수 있음
		if (kIsOutputBufferFull() == TRUE)
		{
			break;
		}
	}

	// 출력 포트(포트 0x60)에 수신된 키보드 컨트롤러의 출력 포트 값을 읽음
	bOutputPortData = kInPortByte(0x60);

	// A20 게이트 비트 설정
	bOutputPortData |= 0x01; // A20 게이트 활성화 비트(비트 1)를 1로 설정, 프로세서를 리셋하려면 bOutputDate=0

	// 입력 버퍼(포트 0x06)에 데이터가 비어있으면 출력 포트에 값을 쓰는 커맨드와 출력 포트 데이터 전송
	for (i = 0; i < 0xFFFF; i++)
	{
		// 입력 버퍼(포트 0x60)가 비었으면 커맨드 전송 가능
		if (kIsInputBufferFull() == FALSE)
		{
			break;
		}
	}

	// 커맨드 레지스터(0x64)에 출력 포트 설정 커맨드(0xD1)을 전달
	kOutPortByte(0x64, 0xD1);
	// 입력 버퍼(0x60)에 A20 게이트 비트가 1로 설정된 값을 전달
	kOutPortByte(0x60, bOutputPortData);
}
```

## 키보드 LED 상태 제어

키보드의 LED 상태를 변경하는 방법은 커맨드 포트를 사용하지 않고 입력 버퍼만 사용한다.
키보드의 LED 상태를 변경하려면 입력 버퍼(포트 0x60)로 0xED 커맨드를 전송해서 키보드에 LED상태 데이터가 전송될 것임을 미리 알려야 한다.
그리고 키보드가 커맨드를 잘 처리했는지 ACK를 확인하고 나서 LED 상태를 나타내는 데이터를 전송한다.

**키보드의 상태 LED를 제어하는 코드**
```
BOOL kChangeKeyboardLED(BOOL bCapsLockOn, BOOL bNumLockOn, BOOL bScrollLockOn)
{
	int i, j;

	// 키모드에 LED 변경 커맨드 전송하고 처리될 때가지 대기
	for (i = 0; i < 0xFFFF; i++)
	{
		// 입력 버퍼(포트 0x60)가 비었으면 커맨드 전송 가능
		if (kIsInputBufferFull() == FALSE)
		{
			break;
		}
	}

	// 출력 버퍼(포트 0x60)로 LED 상태 변경 커맨드(0xED) 전송
	kOutPortByte(0x60, 0xED);
	for (i = 0; i < 0xFFFF; i++)
	{
		// 입력 버퍼(포트 0x60)가 비어 있으면 키보드가 커맨드를 가져간 것임
		if (kIsInputBufferFull() == FALSE)
		{
			break;
		}
	}

	// 키보드가 LED 상태 변경 커맨드를 가져갔으므로 ACK가 올 때까지 대기
	for (j = 0; j < 100; j++)
	{
		for (i = 0; i < 0xFFFF; i++)
		{
			// 출력 버퍼(포트 0x60)가 차있으면 데이터를 읽을 수 있음
			if (kIsOutputBufferFull() == TRUE)
			{
				break;
			}
		}

		// 출력 버퍼(포트 0x60)에서 읽은 데이터가 ACK(0xFA)이면 성공
		if (kInPortByte(0x60) == 0xFA)
		{
			break;
		}
	}

	if (j >= 100)
	{
		return FALSE;
	}

	// LED 변경 값을 키보드로 전송하고 데이터가 처리가 완료될 때까지 대기
	// 해당 비트의 위치로 옮긴 후 OR 연산하여 한 번에 처리할 수 있게 함
	kOutPortByte(0x60, (bCapsLockOn << 2) | (bNumLockOn << 1) | bScrollLockOn);
	for (i = 0; i < 0xFFFF; i++)
	{
		// 입력 버퍼(포트 0x60)가 비어 있으 키보드가 LED 데이터를 가져간 것임
		if (kIsInputBufferFull() == FALSE)
		{
			break;
		}
	}

	// 키보드가 LED 데이터를 가져갔으므로 ACK가 올 때까지 대기
	for (j = 0; j < 100; j++)
	{
		for (i = 0; i < 0xFFFF; i++)
		{
			// 출력 버퍼(포트 0x60)가 차 있으면 데이터를 읽을 수 있음
			if (kIsOutputBufferFull() == TRUE)
			{
				break;
			}
		}

		// 출력 버퍼(포트 0x60)에서 읽은 데이터가 ACK(0xFA)이면 성공
		if (kInPortByte(0x60) == 0xFA)
		{
			break;
		}
	}

	if (j >= 100)
	{
		return FALSE;
	}

	return TRUE;
}
```