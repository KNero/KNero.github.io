# IA-32e 모드용 커널

이제 IA-32e 모드 커널을 생성해 볼 것이다. 보호 모드 커널과 크게 다르지 않으며, 같은 소스 파일 구조로 되어있다.

보호 모드 커널에 IA-32e 모드로 전환하는 모든 코드가 포함되어 있기 때문에, IA-32e 모드 커널 엔트리 포인트는 단순히 세그먼트 레지스터를 교체하고
C 언어 커널 엔트리 포인트 함수를 호출하는 역할만 하게 된다.

여기서는 C 언어에서 어셈블리어 함수를 호출하는 것이 아닌 어셈블리어에서 C 언어 함수를 호출하여야 하므로 `extern` 지시어를 사용할 것이다.
C 언어 엔트리 포인트 파일 역시 보호 모드와 마찬가지로 `Main()` 함수를 엔트리 포인트로 사용할 것이므로 엔트리 포인트 파일의 상단에
`extern Main`을 입력할 것이다.

**IA-32e 모드 커널의 엔트리 포인트 소스 코드(02.Kernel64/Source/EntryPorint.s)**
```
[BITS 64]        ; 이하의 코드는 64비트 코드로 설정

SECTION .text    ; text 섹션(세그먼트)을 정의

; 외부에서 정의된 함수를 쓸 수 있도록 선언함(Import)
extern Main

; 코드 영역
START:
    mov ax, 0x10    ; IA-32e 모드 커널용 데이터 세그먼트 디스크립터를 AX 레지스터에 저장
    mov ds, ax      ; DS 세그먼트 셀렉터에 설정
    mov es, ax      ; ES 세그먼트 셀렉터에 설정
    mov fs, ax      ; FS 세그먼트 셀렉터에 설정
    mov gs, ax      ; GS 세그먼트 셀렉터에 설정

    ; 스택을 0x600000~0x6FFFFF 영역에 1MB 크기로 생성
    mov ss, ax           ; SS 세그먼트 셀렉터에 설정
    mov rsp, 0x6FFFF8    ; RSP 레지스터의 어드레스를 0x6FFFF8로 설정
    mov rbp, 0x5FFFF8    ; RBP 레지스터의 어드레스를 0x6FFFF8로 설정

    call Main            ; C 언어 엔트리 포인트 함수(Main) 호출

    jmp $
```

**IA-32e 모드 커널의 C 언어 엔트리 포인트 소스 코드(02.Kernel64/Source/Main.c)**
```
#include "Types.h"

void kPrintString( int iX, int iY, const char* pcString );

// 아래 함수는 C 언어 커널의 시작 부분임
void Main( void )
{
	kPrintString(0, 10, "Switch To IA-32e Mode Success.");
	kPrintString(0, 11, "IA-32e C Language Kernel Start..............[Pass]");
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
여기서 `Types.h`는 보호 모드와 같으므로 복사하여 사용했다.

이제 가장 어려운 링크 스크립트 파일을 생성해 해줘야한다. `IA-32e` 모드용 커널을 빌드해야 하므로 64비트 이미지에 관련된 `elf_x86_64.x` 파일을 기반으로 하겠다.

![find elf_x86_64.x](/contents/dev/2020/05/07/image/os-study-26-1.png)

위에서 찾은 `elf_x86_64.x` 파일을 `02.Kernel64/elf_x86_64.x`로 복사해오고 `.text`, `.data`, `.bss`에 관련된 필수 섹션을 앞쪽으로 이동하고, `.text`섹션의 시작 어드레스를 0x200000(2MB)로 변경하자.
그리고 보호 모드와 마찬가지로 데이터 섹션의 시작을 섹터 단위로 맞추어 정렬함으로써, 디버깅을 편리하도록 할 것이다.
([02.Kernel64/elf_x86_64.x](https://github.com/KNero/os-study/blob/master/02.Kernel64/elf_x86_64.x)의 앞 부분에 추가된 주석 부분을 확인하면 되며 책에서 달리 뒷 부분은 책의 수정된 부분과 동일하여 수정하지 않았다.)

보호 모드 커널과 달리, IA-32e 모드 커널은 커널 엔트리 포인트와 C 언어 커널 엔트리 포인트가 개별적으로 빌드되어 합쳐지는 형태가 아닌 IA-32e 모드 커널의 커널 엔트리 포인트 파일은 오브젝트 파일의 형태로 컴파일 되어 C 언어 커널과 함께 링크된다. 
따라서 보호 모드의 makefile을 기반으로 사용하되, C 언어 엔트리 포인트 파일이 아니라 커널 엔트리 포인트 파일 링크 목록의 가장 앞에 위치하도록 수정해야 한다.

**IA-32e 모드 커널의 makefile(02.Kernel64/makefile)**
```
#############################
# 빌드 환경 및 규칙 설정
#############################
NASM64 = nasm -f elf64
GCC64 = gcc -c -m64 -ffreestanding
LD64 = ld -melf_x86_64 -T ../elf_x86_64.x -nostdlib -e Main -Ttext 0x200000
OBJCOPY64 = objcopy -j .text -j .data -j .rodata -j .bss -S -O binary

OBJECTDIRECTORY = Temp
SOURCEDIRECTORY = Source

#############################
# 빌드 항목 및 빌드 설정
#############################
all: prepare Kernel64.bin

prepare:
	mkdir -p $(OBJECTDIRECTORY)

dep:
	@echo === Make Dependency File ===
	make -C $(OBJECTDIRECTORY) -f ../makefile InternalDependency
	@echo === Dependency Search Complete ===

ExecuteInternalBuild: dep
	make -C $(OBJECTDIRECTORY) -f ../makefile Kernel64.elf

Kernel64.bin: ExecuteInternalBuild
	$(OBJCOPY64) $(OBJECTDIRECTORY)/Kernel64.elf $(OBJECTDIRECTORY)/$@

clean:
	rm -f *.bin
	rm -f $(OBJECTDIRECTORY)/*.*

#############################
# Make에 의해 다시 호출되는 부분, Temp 디렉터리 기준으로 수행됨
#############################
# 빌드할 어셈블리어 엔트리 포인트 소스 파일 정의, Temp 디렉터리를 기준으로 설정
ENTRYPOINTSOURCEFILE = ../$(SOURCEDIRECTORY)/EntryPoint.s
ENTRYPOINTOBJECTFILE = EntryPoint.o

# 빌드할 C 소스 파일 정의, Temp 디렉터리를 기준으로 설정
CSOURCEFILES = $(wildcard ../$(SOURCEDIRECTORY)/*.c)
ASSEMBLYSOURCEFILES = $(wildcard ../$(SOURCEDIRECTORY)/*.asm)
COBJECTFILES = $(notdir $(patsubst %.c,%.o,$(CSOURCEFILES)))
ASSEMBLYOBJECTFILES = $(notdir $(patsubst %.asm,%.o,$(ASSEMBLYSOURCEFILES)))

# 어셈블리어 엔트리 포인트 빌드
$(ENTRYPOINTOBJECTFILE): $(ENTRYPOINTSOURCEFILE)
	$(NASM64) -o $@ $<

# .c 파일을 .o 파일로 바꾸는 규칙 정의
%.o: ../$(SOURCEDIRECTORY)/%.c
	$(GCC64) -c $<

# .asm 파일을 .o 파일로 바꾸는 규칙 정의
%.o: ../$(SOURCEDIRECTORY)/%.asm
	$(NASM64) -o $@ $<

InternalDependency:
	$(GCC64) -MM $(CSOURCEFILES) > Dependency.dep

Kernel64.elf: $(ENTRYPOINTOBJECTFILE) $(COBJECTFILES) $(ASSEMBLYOBJECTFILES)
	$(LD64) -o $@ $^

ifeq (Dependency.dep, $(wildcard Dependency.dep))
include Dependency.dep
endif
```

이제 기존의 빌드하는 파일들도 모두 수정해 주자.

**IA-32e 모드 커널 빌드가 추가된 최상위 디렉터리의 makefile**
```
all: BootLoader Kernel32 Kernel64 Disk.img Utility

BootLoader:
	@echo
	@echo ================ Build Boot Loader ================
	@echo

	make -C 00.BootLoader

	@echo
	@echo ================ Build Complete ================
	@echo

Kernel32:
	@echo
	@echo ================ Build 32Bit Kernel ================
	@echo

	make -C 01.Kernel32

	@echo
	@echo ================ Build Complete ================
	@echo

Kernel64:
	@echo
	@echo ================ Build 64Bit Kernel ================
	@echo

	make -C 02.Kernel64

	@echo
	@echo ================ Build Complete ================
	@echo

Disk.img: 00.BootLoader/BootLoader.bin 01.Kernel32/Temp/Kernel32.bin 02.Kernel64/Temp/Kernel64.bin
	@echo
	@echo ================ Disk Image Build Start ================
	@echo

	./04.Utility/00.ImageMaker/ImageMaker.exe $^

	@echo
	@echo ================ All Build Complete ================
	@echo

Utility:
	@echo
	@echo ================ Utility Build Start ================
	@echo

	mek -C 04.Utility

	@echo
	@echo ================ Utility Build Complete ================
	@echo

clean:
	make -C 00.BootLoader clean
	make -C 01.Kernel32 clean
	make -C 01.Kernel64 clean
	make -C 04.Utility clean
	rm -f Disk.img
```

다음에는 `ImageMaker` 프로그램을 수정해 보겠다.