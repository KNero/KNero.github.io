# 키보드 디바이스 드라이버의 통합과 빌드

앞서 배운 키보드의 내용들을 OS 에 적용해보자. (키보드 디바이스 드라이버와 간단한 셸 추가)

**키보드 디바이스 드라이버 소스 파일**

[02.Kernel64/Source/Keyboard.c](https://github.com/KNero/os-study/blob/master/02.Kernel64/Source/Keyboard.c)

**키보드 디바이스 드라이버 헤더 파일**

[02.Kernel64/Source/Keyboard.h](https://github.com/KNero/os-study/blob/master/02.Kernel64/Source/Keyboard.h)

이제 `kInPortByte()`, `kOutPortByte()` 함수는 어셈블리어 명령인 `in`과 `out`을 호출하는 어셈블리어 함수이므로 어셈블리어 함수가 정의된 오브젝트 파일이 필요하다.
앞으로도 여러 번 어셈블리어를 사용할 것이기 때문에 `AssemblyUtility.asm`, `AssemblyUtility.h` 파일을 생성하여 어셈블리어 함수를 추가하는 용도로 사용할 것이다.

**어셈블리어 유틸리티 함수 소스 파일(02.Kernel64/Source/AssemblyUtility.asm)**
```
[BITS 64]           ; 이하의 코드는 64비트 코드로 설정

SECTION .text       ; text 섹션(세그먼트)을 정의

; C 언어에서 호출할 수 있도록 이름을 노출함
global kInPortByte, kOutPortByte

; 포트로부터 1바이트를 읽음
; PARAM: 포트 번호
kInPortByte:
    push rdx        ; 함수에서 임시로 사용하는 레지스터를 스택에 저장
                    ; 함수의 마지막 부분에서 스택에 삽입된 값을 꺼내 복원

    mov rdx, rdi    ; RDX 레지스터에 파라미터 1(포트 번호)를 저장
    mov rax, 0      ; RAX 레지스터를 초기화
    in al, dx       ; DX 레지스터에 저장된 포트 어드레스에서 한 바이트를 읽어 AL 레지스터에 저장
                    ; AL 레지스터는 함수의 반환 값으로 사용됨
                    ; 포트 I/O 어드레스에서 데이터를 읽어오는 명령어

    pop rdx         ; 함수에서 사용이 끝난 레지스터를 복원
    ret             ; 함수를 호출한 다음 코드의 위치를 복귀

; 포트에 1바이트를 씀
; PARAM: 포트 번호, 데이터
kOutPortByte:
    push rdx        ; 함수에서 임시로 사용하는 레지스터를 스택에 저장
    push rax        ; 함수의 마지막 부분에서 스택에 삽입된 값을 꺼내 복원

    mov rdx, rdi    ; RDX 레지스터에 파라미터 1(포트 번호)를 저장
    mov rax, rsi    ; RAX 레지스터에 파라미터 2(데이터)를 저장
    out dx, al      ; DX 레지스터에 저장된 포트 어드레스에 AL 레지스터에 저장된 한 바이트를 씀
                    ; 포트 I/O 어드레스에 데이터를 쓰는 명령어

    pop rax         ; 함수에서 사용이 끝난 레지스터를 복원
    pop rdx
    ret             ; 함수를 호출한 다음 코드의 위치로 복귀
```

**어셈블리어 유틸리티 함수 헤더 파일(02.Kernel64/Source/AssemblyUtility.h)**
```
#ifndef __ASSEMBLYUTILITY_H__
#define __ASSEMBLYUTILITY_H__

#include "Types.h"

BYTE kInPortByte(WORD wPort);
void kOutPortByte(WORD wPort, BYTE bData);

#endif /* __ASSEMBLYUTILITY_H__ */
```

이제 마지막으로 C 언어 커널 엔트리 포인트를 수정하면 된다.
추가된 기능을 수행할 수 있도록 키보드 컨트롤러와 키보드를 활성화하고 간단한 셸을 실행하면 끝이다.
이를 위해서는 엔트리 포인트의 뒷부분에 키보드 드라이버 함수를 호출하는 코드를 추가하면 된다.

**IA-32e 모드 커널의 C 언어 엔트리 포인트 소스 코드(02.Kernel64/Source/Main.c)**
```
#include "Types.h"
#include "Keyboard.h"

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
	kPrintString(0, 12, "Keyboard Activate...........................[    ]");

	// 키보드를 활성화
	if (kActivateKeyboard() == TRUE)
	{
		kPrintString(45, 12, "Pass");
		kChangeKeyboardLED(FALSE, FALSE, FALSE);
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

이제 마지막으로 빌드 후 실행해보자!

![keyboard](/contents/dev/2020/05/27/image/os-study-31-1.png)

실행한 뒤 `this is my message:)` 라고 입력하고 복명복창하는 OS를 확인할 수 있었다.
하지만 이상하게 소문자를 대문자나 shift를 누르고 특수문자를 입력하면 물음표가 같이 출력됐다.
다음 과정에서 해결되지 않으면 다시 이 부분의 코드를 확인해 봐야 할 듯..