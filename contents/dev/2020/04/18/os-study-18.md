# IA-32e 에서 사용할 메모리 크기 검사

사용 가능한 메모리를 검사하는 가장 확실한 방법은 메모리에 특정 값을 쓰고 다시 읽어서 같은 값이 나오는지 확인하는 것이다.
여기서는 1MB 단위로 어드레스를 증가 시키면서 각 MB의 첫 번째 4바이트에 `0x12345678`를 쓰고 읽어 보는 것으로 하겠다.
(바이트 단위로 할 수도 있지만 너무 오래 걸릴 수 있다.)

**01.Kernel32/Source/Main.c**
```
#include "Types.h"

void kPrintString( int iX, int iY, const char* pcString );
BOOL kInitializeKernel64Area(void);
BOOL kIsMemoryEnough(void);

// Main 함수
void Main( void )
{
	DWORD i;

	kPrintString(0, 3, "C Language Kernel Start.....................[Pass]");

	// 최소 메모리 크기를 만족하는 지 검사
	kPrintString(0, 4, "Minimum Memory Size Check...................[    ]");
	if (kIsMemoryEnough() == FALSE)
	{
		kPrintString(45, 4, "Fail");
		kPrintString(0, 5, "Not Enough Memory. MINT64 OS Requires Over 64Mbyte Memory~!!");
		while (1);
	}
	else
	{
		kPrintString(45, 4, "Pass");
	}

	// IA-32e 모드의 커널 영역을 초기화
	kPrintString(0, 5, "IA-32e Kernel Area Initialize...............[    ]");
	if (kInitializeKernel64Area() == FALSE)
	{
		kPrintString(45, 5, "Fail");
		kPrintString(0, 6, "Kernel Area Initailization Fail.");
		while (1);
	}
	kPrintString(45, 5, "Pass");

	while( 1 );
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

// IA-32e 모드용 커널 영역을 0으로 초기화
BOOL kInitializeKernel64Area(void)
{
	DWORD* pdwCurrentAddress;

	// 초기화를 시작할 어드레스인 0x100000(1MB)을 설정
	pdwCurrentAddress = (DWORD*)0x100000;

	// 마지막 어드레스인 0x600000(6MB)까지 루프를 돌면서 4바이트씩 0으로 채움
	while ((DWORD)pdwCurrentAddress < 0x600000)
	{
		*pdwCurrentAddress = 0x00;

		// 0으로 저장한 후 다시 읽었을 때 0이 나오지 않으면 해당 어드레스를
		// 사용하는데 문제가 생긴 것이므로 더이상 진행하지 않는다.
		if (*pdwCurrentAddress != 0)
		{
			return FALSE;
		}

		pdwCurrentAddress++;
	}

	return TRUE;
}

// MINT64 OS를 실행하기에 충분한 메모리를 가지고 있는지 체크
BOOL kIsMemoryEnough(void)
{
	DWORD* pdwCurrentAddress;

	// 0x100000(1MB)부터 검사 시작
	pdwCurrentAddress = (DWORD*)0x100000;

	// 0x4000000(64MB)까지 루프를 돌면서 확인
	while ((DWORD)pdwCurrentAddress < 0x4000000)
	{
		*pdwCurrentAddress = 0x12345678;

		// 0x12345678로 저장한 후 다시 읽었을 때 0x12345678이 나오지 않으면
		// 해당 어드레스를 사용하는데 문제가 생긴 것이므로 더이상 진행하지 않고 종료
		if (*pdwCurrentAddress != 0x12345678)
		{
			return FALSE;
		}

		// 1MB씩 이동하면서 확인
		pdwCurrentAddress += (0x100000 / 4);
	}

	return TRUE;
}
```

이렇게 `Main.c`를 수정해 주고 실행해 본다면 정상적으로 부팅된 모습을 볼 수있다.

![os booting](/contents/dev/2020/04/18/image/os-study-18-1.png)

만약 QEMU 실행 명령어를 변경하여 메모리를 32MB로 설정한다면 아래와 같이 실패한 모습을 볼 수있다.

```
qemu-system-x86_64 -L . -m 32 -fda ./Disk.img -localtime -display curses
```
**-m 32** : 가상머신의 메모리를 32MB로 설정

![os booting](/contents/dev/2020/04/18/image/os-study-18-2.png)

이것으로 1MB 이상의 메모리에 접근하는 데 필요한 작압은 모두 했고 다음 스터디에서는 페이징에 대한 설정을 할 예정이다.
페이징 모드까지 하면 IA-32e 모드로 집입한다고 하니 힘을내서 어려운 페이징을 진행해 볼 것이다.