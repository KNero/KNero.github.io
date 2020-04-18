# IA-32e 모드 커널 메모리 초기화


이번에는 IA-32e 모드 커널을 실행하기 위한 준비 작업으로 PC에 설치된 메모리가 64MB 이상인지 검사하고 IA-32e 모드 커널이 위치할 영역을 모두 0으로 초기화하는 작업을 진행하겠다.

**현재 개발하는 OS의 메모리 맵**

![os memory map](/contents/dev/2020/04/17/image/os-study-16-1.png)

**IA-32e 모드 커널이 위치할 공간을 0으로 초기화 (01.Kernel/Source/Main.c)**
```
#include "Types.h"

void kPrintString( int iX, int iY, const char* pcString );
BOOL kInitializeKernel64Area(void);

// Main 함수
void Main( void )
{
	DWORD i;

	kPrintString(0, 3, "C Language Kernel Started.");

	// IA-32e 모드의 커널 영역을 초기화
	kInitializeKernel64Area();
	kPrintString(0, 4, "IA-32e Kernel Area Initialization Complete");

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
```
이제 빌드 후 실행해 보면 아래와 같은 로그를 볼 수 있다.
![os memory map](/contents/dev/2020/04/17/image/os-study-16-2.png)

나는 해보지 않았지만 책에서는 현재의 이미지를 PC를 부팅할 때 사용하게 되면 리부팅이 된다고 한다.
이것은 QEMU와 환경이 다르기 때문에 말생하는 것으로 PC는 하위 기종에 대한 호환성을 유지하기 위해 어드레스 라인을 비활성화했기 때문이라고 적혀있다.
`어드레스 라인` 이 어떤것인지 나도 알수가 없기 때문에 다음에 책에 설명이 나오면 공부해 볼 예정이다.