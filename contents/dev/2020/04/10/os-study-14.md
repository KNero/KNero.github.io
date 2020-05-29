# C소스 파일 추가 & 보호 모드 엔트리 포인트 통합

이제 <a href="https://knero.github.io/#/contents?path=/contents/dev/2020/04/08/os-study-13.md" target="blank">os-study 13</a>에서 설명했던 내용들을 기반으로 소스를 직접 작성할 것이다. C언어로 개발된 소스를 기존 `EntryPoint.s`에 연결해 보자.
보호 모드 전반에 걸쳐 사용할 공통으로 사용할 헤더 파일을 생성할 것인데 기본 데이터 타입과 자료구조를 정의하는데 사용한다.

**01.Kernel32/Source/Types.h**

```
#ifndef __TYPES_H__
#define __TYPES_H__

#define BYTE	unsigned char
#define WORD	unsigned short
#define DWORD	unsigned int
#define QWORD	unsigned long
#define BOOL	unsigned char

#define TRUE	1
#define FALSE	0
#define	NULL	0

// 구조체의 크기 정렬(Size Align)에 관련된 지시어(Directive)로 
// 구조체의 크기를 1바이트로 정렬하여 추가적인 메모리 공간을 더 할당하지 않게 한다.
#pragma pack( push, 1 )

// 비디오 모드 중 텍스트 모드 화면을 구성하는 자료구조
typedef struct kCharactorStruct
{
	BYTE bCharactor;
	BYTE bAttribute;
} CHARACTER;

#pragma pack( pop )
#endif /*__TYPES_H__*/
```

**01.Kernel32/Source/Main.c**

```
#include "Types.h"

void kPrintString( int iX, int iY, const char* pcString );

// Main 함수
void Main( void )
{
	kPrintString( 0, 3, "C Language Kernel Started.");

	while( 1 );
}

void kPrintString( int iX, int iY, const char* pcString )
{
	CHARACTER* pstScreen = ( CHARACTER* ) 0xB8000;
	int i;

	prtScreen += ( iY * 80 ) + iX;
	for ( i = 0; pcString[i] != 0; i++ )
	{
		pstScreen[i].bCharactor = pcString[i];
	}
}
```

Main() 함수를 가장 앞쪽으로 위치시켜, 컴파일 시에 코드 섹션의 가장 앞쪽에 위치하게 했다. 
그리고 메시지를 출력하고 무한 루프를 수행하도록 했다.
이제 보호 모드 엔트리를 수정하여 0x10200 어드레스에 로딩될 C 커널을 실행하겠다.

**01.Kernel32/Source/EntryPoint.s 수정**

```
jmp $    ; 현재 위치에서 무한 루프 수행
```
위 부분을 아래와 같이 수정
```
jmp dword 0x08: 0x10200    ; C 언어 커널이 존재하는 0x10200 어드레스로 이동하여 C 언어 커널 수행
```

**01.Kernel32/makefile**
```
# 빌드 환경 및 규칙 설정
NASM32 = nasm
GCC32 = gcc -c -m32 -ffreestanding
LD32 = ld -melf_i386 -T ../elf_i386.x -nostdlib -e Main -Ttext 0x10200
OBJCOPY32 = objcopy -j .text -j .data -j .rodata -j .bss -S -O binary

OBJECTDIRECTORY = Temp
SOURCEDIRECTORY = Source

# 빌드 항목 및 빌드 방법 설정
all: prepare Kernel32.bin

prepare:
	mkdir -p $(OBJECTDIRECTORY)

$(OBJECTDIRECTORY)/EntryPoint.bin: $(SOURCEDIRECTORY)/EntryPoint.s
	$(NASM32) -o $@ $<

dep:
	@echo === Make Dependency File ===
	make -C $(OBJECTDIRECTORY) -f ../makefile InternalDependency
	@echo === Dependency Search Complete ===

ExecuteInternalBuild: dep
	make -C $(OBJECTDIRECTORY) -f ../makefile Kernel32.elf

$(OBJECTDIRECTORY)/Kernel32.elf.bin: ExecuteInternalBuild
	$(OBJCOPY32) $(OBJECTDIRECTORY)/Kernel32.elf $@

Kernel32.bin: $(OBJECTDIRECTORY)/EntryPoint.bin $(OBJECTDIRECTORY)/Kernel32.elf.bin
	cat $^ > $(OBJECTDIRECTORY)/$@

clean:
	rm -f *.bin
	rm -f $(OBJECTDIRECTORY)/*.*

# Make에 의해 다시 호출되는 부분, Temp 디렉터리를 기준으로 수행됨
CENTRYPOINTOBJECTFILE = Main.o
# 디렉터리에 특정 패턴의 파일을 추출하는 wildcard함수를 사용하여 Source 디렉터리에 확장자가 .c인 파일을 가져온다.
CSOURCEFILES = $(wildcard ../$(SOURCEDIRECTORY)/*.c)
ASSEMBLYSOURCEFILES = $(wildcard ../$(SOURCEDIRECTORY)/*.asm)
COBJECTFILES = $(subst Main.o, , $(notdir $(patsubst %.c,%.o,$(CSOURCEFILES))))
ASSEMBLYOBJECTFILES = $(notdir $(patsubst %.asm,%.o,$(ASSEMBLYSOURCEFILES)))
# patsubst: 패턴 치환 함수
# %.c: .c의 확장자를 가지는 모든 문자열
# %(CSOURCEFILES): CSOURCEFILES 변수에 담긴 값
# subst: 문자열 치환함수


# .c 파일을 .o 파일로 바꾸는 규칙 정의
%.o: ../$(SOURCEDIRECTORY)/%.c
		$(GCC32) -c $<

# .asm 파일을 .o 파일로 바꾸는 규칙 정의
%.o: ../$(SOURCEDIRECTORY)/%.asm
		$(NASM32) -f elf32 -o $@ $<

# 의존관계를 저장한다.
InternalDependency:
	$(GCC32) -MM $(CSOURCEFILES) > Dependency.dep

Kernel32.elf: $(CENTRYPOINTOBJECTFILE) $(COBJECTFILES) $(ASSEMBLYOBJECTFILES)
	$(LD32) -o $@ $^

# wildcard 함수의 결과가 Dependency.dep와 같으면 endif 까지 구문 수행
ifeq (Dependency.dep, $(wildcard Dependency.dep)) 
include Dependency.dep
endif
```

책에서는 최종 결과물인 `kernel32.bin`을 `01.Kerner32`폴더 밑에 생성하도록 했지만 나는 최상위의 makefile에 `Temp`밑에서 찾도록 했기 때문에 그 부분만 수정해 주었다.
```
Kernel32.bin: $(OBJECTDIRECTORY)/EntryPoint.bin $(OBJECTDIRECTORY)/Kernel32.elf.bin
	cat $^ > $@   ===> cat $^ > $(OBJECTDIRECTORY)/$@
```

그리고 커널파일의 크기가 조금 더 커져서 또 `BootLoader.asm` 의 `TOTALSECTORCOUNT`을 2로 수정해 주어야 했다.
```
TOTALSECTORCOUNT: dw 0x02   ; 부트 로더를 제외한 MINT64 OS 이미지의 크기. 최대 1152 세터 (0x90000byte) 까지 가능
```
몇 가지 오타가 있어서 수정하고 빌드를 하니 `Disk.img`파일이 생성됐고 폴더구조는 아래와 같다.

![os study directory](/contents/dev/2020/04/10/image/os-study-14-2.png)

실행하니 신기하게도 C로 작성된 OS가 실행됐다.

![c kernel](/contents/dev/2020/04/10/image/os-study-14-1.png)