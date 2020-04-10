# C 코드 커널 생성

## 제약조건 및 생성방법

- 부팅된 후 보호 모드 커널이 실행되면 C 라이브러리가 없으므로 라이브러리에 포함된 함수를 호출할 수 없으므로 C 라이브러리를 사용하지 않게 빌드한다
- 0x10000의 위치에는 보호 모드 엔트리 포인트가 있으므로 512바이트 이후인 0x10200의 위치부터 로딩되므로 0x10200 위치에서 실행하게끔 빌드한다
- 코드나 데이터 외에 기타 정보를 포함하지 않은 순수한 바이너리 파일 형태여야 한다. 
GCC를 통해서 실행 파일을 생성하면 ELF, PE 파일포맷과 같이 특정 OS에서 실행할 수 있는 포맷으로 생성되는데 코드와 데이터 정보 이외에 불필요한 정보를 포함하고 있다.

오브젝트 파일을 링크하여 실행 파일을 만들려면 실행파일을 구성하는 섹션의 배치와 로딩될 어드레스, 코드 내에서 가장 먼저 실행될 코드인 엔트리 포인트를 지정해줘야 한다.
그리고 섹션을 배치하는 방식과 크기 정렬 방식에 따라서 OS의 메모리 구조와 크기가 달라진다.

섹션 배치를 다시 하는 이유는 실행 파일이 링크될 때 코드나 데이터 이외에 디버깅 관련 정보와 심볼 정보 등이 포함되기 때문이다. 
이 정보들은 커널 실행과 직접적인 관련이 없으므로 최종 바이너리 파일에서 섹션을 재배치해서 제거할 것이다.

## 중요한 섹션

- .text: 함수의 실제 코드가 저장되는 영역. 수정이 거의 없으므로 Read-Only
- .data: 초기화된 전역 변수(Global Variable) 혹은 0이 아닌 값으로 초기화된 정적 변수(Static Variable) 등. 읽기/쓰기
- .bss : 초기화되지 않은 변수만 포함. 섹션은 0으로 초기화될 뿐, 실제 데이터가 없으므로 오브젝트 파일 상에도 별도의 영역을 차지하지 않는다.

오브젝트 파일은 중간 단계의 생성물로 소스 코드를 컴파일하여 생성한 오브젝트 파일은 각 섹션의 크기와 파일 내에 있는 오프셋 정보만 들어있다. 
다른 오브젝트 파일과 합쳐지기 때문이다. 합쳐지는 순서에 따라서 섹션의 어드레스는 얼마든지 바뀔 수 있다.

오브젝트 파일들을 결합하여 정리하고 실제 메모리에 로딩될 위치를 결정하는 것이 바로 링커(Linker) 이며 이러한 과정을 Link또는 Linking 이라고 한다.

![linking](/contents/dev/2020/04/08/image/os-study-13-1.png)

**링커 스크립트의 기본 형식**

```
SECTIONS
{
	Section    Load Address:    ; 센션 이름과 메모리에 로드할 어드레스
	{
        *(.text)                ; 오브젝트 파일의 섹션 중에 SectionName에 통합한 섹션 이름
        ... 생략 ...
        . = ALIGN (AlignValue)  ; 현재 어드레스를 Align Value에 맞추어 이동, 다음 섹션의 시작은 AlignValue의 배수 (.은 현재 어드레스를 나타내는 기호)
	} =0x00000000               ; 섹션을 채울 기본 값

	... 생략 ...
}
```

섹션의 재배치는 텍스트나 데이터와 관계없는 섹션(.tdata, .tbss, .ctors, .got 등)의 기본 구조, 즉 `SectionName{...}` 부분 전체를 코드 및 데이터 섹션의 뒷 부분으로 이동하거나, 코드 및 데이터 관련 섹션(.text, .data, .bss, .rodata)을 가장 앞으로 이동 함으로써 처리할 수 있다. 여기서는 필요한 섹션을 앞으로 이동하도록 하겠다.

책에서 링커 스크립트 파일인 `elf_i386.x`를 사용한다고 했고 우리는 cygwin이 아닌 우분투 도커이기 때문에 책의 위치와 다르므로 아래 명령어를 통해 찾아보자 파일을 찾아보자.
(같은 이름의 파일이 얼마나 있는지 확인하고 싶어 확장자는 사용하지 않았다.)
```
find / | grep elf_i386

/usr/lib/ldscripts/elf_i386.xs
/usr/lib/ldscripts/elf_i386.xdc
/usr/lib/ldscripts/elf_i386.xu
/usr/lib/ldscripts/elf_i386.xc
/usr/lib/ldscripts/elf_i386.xsw
/usr/lib/ldscripts/elf_i386.xsc
/usr/lib/ldscripts/elf_i386.xn
/usr/lib/ldscripts/elf_i386.xdw
/usr/lib/ldscripts/elf_i386.xbn
/usr/lib/ldscripts/elf_i386.xr
/usr/lib/ldscripts/elf_i386.xd
/usr/lib/ldscripts/elf_i386.xw
/usr/lib/ldscripts/elf_i386.x
```
맨 아래의 파일을 cp 명령을 통해 가져오자
```
cp /usr/lib/ldscripts/elf_i386.x /home/ubuntu/os-study/01.Kernel32/
```

수정된 부분은 한글 주석 위주로 보면된다.
(OS를 개발하는 사람들은 정말 존경스럽다...)
```
/* Default linker script, for normal executables */
/* Copyright (C) 2014-2015 Free Software Foundation, Inc.
   Copying and distribution of this script, with or without modification,
   are permitted in any medium without royalty provided the copyright
   notice and this notice are preserved.  */
OUTPUT_FORMAT("elf32-i386", "elf32-i386",
	      "elf32-i386")
OUTPUT_ARCH(i386)

ENTRY(Main) /* Main 함수를 엔트리 포인트로 지정 */

SEARCH_DIR("=/usr/local/lib/i386-linux-gnu"); SEARCH_DIR("=/lib/i386-linux-gnu"); SEARCH_DIR("=/usr/lib/i386-linux-gnu"); SEARCH_DIR("=/usr/local/lib32"); SEARCH_DIR("=/lib32"); SEARCH_DIR("=/usr/lib32"); SEARCH_DIR("=/usr/local/lib"); SEARCH_DIR("=/lib"); SEARCH_DIR("=/usr/lib"); SEARCH_DIR("=/usr/i386-linux-gnu/lib32"); SEARCH_DIR("=/usr/x86_64-linux-gnu/lib32"); SEARCH_DIR("=/usr/i386-linux-gnu/lib");
SECTIONS
{
  /* Read-only sections, merged into text segment: */
  PROVIDE (__executable_start = SEGMENT_START("text-segment", 0x08048000)); . = SEGMENT_START("text-segment", 0x08048000) + SIZEOF_HEADERS;
  
  /******************************************************/
  /* 섹션 재배치로 인해 앞으로 이동된 부분 */
  .text 0x10200          : /* .text 섹션을 0x10200에 로딩하도록 지정 */
  {
    *(.text.unlikely .text.*_unlikely .text.unlikely.*)
    *(.text.exit .text.exit.*)
    *(.text.startup .text.startup.*)
    *(.text.hot .text.hot.*)
    *(.text .stub .text.* .gnu.linkonce.t.*)
    /* .gnu.warning sections are handled specially by elf32.em.  */
    *(.gnu.warning)
  } =0x90909090

  .rodata         : { *(.rodata .rodata.* .gnu.linkonce.r.*) }
  .rodata1        : { *(.rodata1) }

  /* 데이터 영역의 시작을 섹터 단위로 맞춤 */
  . = ALIGN (512); /* 현재 위치를 512바이트 위치로 정렬, 바로 다음에 위치하는 .data 섹션은 512 바이트로 정렬된 어드레스에 위치 */

  .data           :
  {
    *(.data .data.* .gnu.linkonce.d.*)
    SORT(CONSTRUCTORS)
  }
  .data1          : { *(.data1) }

  __bss_start = .;
  .bss            :
  {
   *(.dynbss)
   *(.bss .bss.* .gnu.linkonce.b.*)
   *(COMMON)
   /* Align here to ensure that the .bss section occupies space up to
      _end.  Align after .bss to ensure correct alignment even if the
      .bss section disappears because there are no input sections.
      FIXME: Why do we need it? When there is no .bss section, we don't
      pad the .data section.  */
   . = ALIGN(. != 0 ? 32 / 8 : 1);
  }
  . = ALIGN(32 / 8);
  . = ALIGN(32 / 8);
  _end = .; PROVIDE (end = .);
  /******************************************************/

  .interp         : { *(.interp) }
  .note.gnu.build-id : { *(.note.gnu.build-id) }
  .hash           : { *(.hash) }
  .gnu.hash       : { *(.gnu.hash) }
  .dynsym         : { *(.dynsym) }
  .dynstr         : { *(.dynstr) }
  .gnu.version    : { *(.gnu.version) }
  .gnu.version_d  : { *(.gnu.version_d) }
  .gnu.version_r  : { *(.gnu.version_r) }
  .rel.init       : { *(.rel.init) }
  .rel.text       : { *(.rel.text .rel.text.* .rel.gnu.linkonce.t.*) }
  .rel.fini       : { *(.rel.fini) }
  .rel.rodata     : { *(.rel.rodata .rel.rodata.* .rel.gnu.linkonce.r.*) }
  .rel.data.rel.ro   : { *(.rel.data.rel.ro .rel.data.rel.ro.* .rel.gnu.linkonce.d.rel.ro.*) }
  .rel.data       : { *(.rel.data .rel.data.* .rel.gnu.linkonce.d.*) }
  .rel.tdata	  : { *(.rel.tdata .rel.tdata.* .rel.gnu.linkonce.td.*) }
  .rel.tbss	  : { *(.rel.tbss .rel.tbss.* .rel.gnu.linkonce.tb.*) }
  .rel.ctors      : { *(.rel.ctors) }
  .rel.dtors      : { *(.rel.dtors) }
  .rel.got        : { *(.rel.got) }
  .rel.bss        : { *(.rel.bss .rel.bss.* .rel.gnu.linkonce.b.*) }
  .rel.ifunc      : { *(.rel.ifunc) }
  .rel.plt        :
    {
      *(.rel.plt)
      PROVIDE_HIDDEN (__rel_iplt_start = .);
      *(.rel.iplt)
      PROVIDE_HIDDEN (__rel_iplt_end = .);
    }
  .init           :
  {
    KEEP (*(SORT_NONE(.init)))
  }
  .plt            : { *(.plt) *(.iplt) }
  .plt.got        : { *(.plt.got) }
  
  .fini           :
  {
    KEEP (*(SORT_NONE(.fini)))
  }
  PROVIDE (__etext = .);
  PROVIDE (_etext = .);
  PROVIDE (etext = .);
  
  
  
  .gnu_extab   : ONLY_IF_RO { *(.gnu_extab*) }
  /* These sections are generated by the Sun/Oracle C++ compiler.  */
  .exception_ranges   : ONLY_IF_RO { *(.exception_ranges
  .exception_ranges*) }
  /* Adjust the address for the data segment.  We want to adjust up to
     the same address within the page on the next page up.  */
  . = DATA_SEGMENT_ALIGN (CONSTANT (MAXPAGESIZE), CONSTANT (COMMONPAGESIZE));
  /* Exception handling  */
  
  .gnu_extab      : ONLY_IF_RW { *(.gnu_extab) }
  
  .exception_ranges   : ONLY_IF_RW { *(.exception_ranges .exception_ranges*) }
  /* Thread Local Storage sections  */
  
  .preinit_array     :
  {
    PROVIDE_HIDDEN (__preinit_array_start = .);
    KEEP (*(.preinit_array))
    PROVIDE_HIDDEN (__preinit_array_end = .);
  }
  .init_array     :
  {
    PROVIDE_HIDDEN (__init_array_start = .);
    KEEP (*(SORT_BY_INIT_PRIORITY(.init_array.*) SORT_BY_INIT_PRIORITY(.ctors.*)))
    KEEP (*(.init_array EXCLUDE_FILE (*crtbegin.o *crtbegin?.o *crtend.o *crtend?.o ) .ctors))
    PROVIDE_HIDDEN (__init_array_end = .);
  }
  .fini_array     :
  {
    PROVIDE_HIDDEN (__fini_array_start = .);
    KEEP (*(SORT_BY_INIT_PRIORITY(.fini_array.*) SORT_BY_INIT_PRIORITY(.dtors.*)))
    KEEP (*(.fini_array EXCLUDE_FILE (*crtbegin.o *crtbegin?.o *crtend.o *crtend?.o ) .dtors))
    PROVIDE_HIDDEN (__fini_array_end = .);
  }

  /******************************************************/
  /* 섹션 재배치로 인해 이동된 부분 */
  _edata = .; PROVIDE (edata = .);

  .tdata    : { *(.tdata .tdata.* .gnu.linkonce.td.*) }
  .tbss     : { *(.tbss .tbss.* .gnu.linkonce.tb.*) *(.tcommon) }
  /******************************************************/

  .ctors          :
  {
    /* gcc uses crtbegin.o to find the start of
       the constructors, so we make sure it is
       first.  Because this is a wildcard, it
       doesn't matter if the user does not
       actually link against crtbegin.o; the
       linker won't look for a file to match a
       wildcard.  The wildcard also means that it
       doesn't matter which directory crtbegin.o
       is in.  */
    KEEP (*crtbegin.o(.ctors))
    KEEP (*crtbegin?.o(.ctors))
    /* We don't want to include the .ctor section from
       the crtend.o file until after the sorted ctors.
       The .ctor section from the crtend file contains the
       end of ctors marker and it must be last */
    KEEP (*(EXCLUDE_FILE (*crtend.o *crtend?.o ) .ctors))
    KEEP (*(SORT(.ctors.*)))
    KEEP (*(.ctors))
  }
  .dtors          :
  {
    KEEP (*crtbegin.o(.dtors))
    KEEP (*crtbegin?.o(.dtors))
    KEEP (*(EXCLUDE_FILE (*crtend.o *crtend?.o ) .dtors))
    KEEP (*(SORT(.dtors.*)))
    KEEP (*(.dtors))
  }
  .jcr            : { KEEP (*(.jcr)) }
  .data.rel.ro : { *(.data.rel.ro.local* .gnu.linkonce.d.rel.ro.local.*) *(.data.rel.ro .data.rel.ro.* .gnu.linkonce.d.rel.ro.*) }
  .dynamic        : { *(.dynamic) }
  .got            : { *(.got) *(.igot) }
  . = DATA_SEGMENT_RELRO_END (SIZEOF (.got.plt) >= 12 ? 12 : 0, .);
  .got.plt        : { *(.got.plt)  *(.igot.plt) }
  
  /******************************************************/
  /* 섹션 재배치로 인해 이동된 부분 */
  .eh_frame_hdr : { *(.eh_frame_hdr) *(.eh_frame_entry .eh_frame_entry.*) }
  .eh_frame       : ONLY_IF_RO { KEEP (*(.eh_frame)) *(.eh_frame.*) }

  /* Exception handling  */
  .gcc_except_table   : ONLY_IF_RO { *(.gcc_except_table .gcc_except_table.*) }
  .eh_frame       : ONLY_IF_RW { KEEP (*(.eh_frame)) *(.eh_frame.*) }
  .gcc_except_table   : ONLY_IF_RW { *(.gcc_except_table .gcc_except_table.*) }
  /******************************************************/
  
  . = .;
  
  . = SEGMENT_START("ldata-segment", .);
  
  . = DATA_SEGMENT_END (.);
  /* Stabs debugging sections.  */
  .stab          0 : { *(.stab) }
  .stabstr       0 : { *(.stabstr) }
  .stab.excl     0 : { *(.stab.excl) }
  .stab.exclstr  0 : { *(.stab.exclstr) }
  .stab.index    0 : { *(.stab.index) }
  .stab.indexstr 0 : { *(.stab.indexstr) }
  .comment       0 : { *(.comment) }
  /* DWARF debug sections.
     Symbols in the DWARF debugging sections are relative to the beginning
     of the section so we begin them at 0.  */
  /* DWARF 1 */
  .debug          0 : { *(.debug) }
  .line           0 : { *(.line) }
  /* GNU DWARF 1 extensions */
  .debug_srcinfo  0 : { *(.debug_srcinfo) }
  .debug_sfnames  0 : { *(.debug_sfnames) }
  /* DWARF 1.1 and DWARF 2 */
  .debug_aranges  0 : { *(.debug_aranges) }
  .debug_pubnames 0 : { *(.debug_pubnames) }
  /* DWARF 2 */
  .debug_info     0 : { *(.debug_info .gnu.linkonce.wi.*) }
  .debug_abbrev   0 : { *(.debug_abbrev) }
  .debug_line     0 : { *(.debug_line .debug_line.* .debug_line_end ) }
  .debug_frame    0 : { *(.debug_frame) }
  .debug_str      0 : { *(.debug_str) }
  .debug_loc      0 : { *(.debug_loc) }
  .debug_macinfo  0 : { *(.debug_macinfo) }
  /* SGI/MIPS DWARF 2 extensions */
  .debug_weaknames 0 : { *(.debug_weaknames) }
  .debug_funcnames 0 : { *(.debug_funcnames) }
  .debug_typenames 0 : { *(.debug_typenames) }
  .debug_varnames  0 : { *(.debug_varnames) }
  /* DWARF 3 */
  .debug_pubtypes 0 : { *(.debug_pubtypes) }
  .debug_ranges   0 : { *(.debug_ranges) }
  /* DWARF Extension.  */
  .debug_macro    0 : { *(.debug_macro) }
  .gnu.attributes 0 : { KEEP (*(.gnu.attributes)) }
  /DISCARD/ : { *(.note.GNU-stack) *(.gnu_debuglink) *(.gnu.lto_*) }
}
```

수정된 링커 스크립트를 직접 지정하여 오브젝트 파일을 링크하는 방법은 아래와 같다.
```
x86_64-pc-linux-ld.exe -melf_i386 -T elf_i386.x -nostdlib Main.o -o Main.elf
```
`-melf_i386`: Binutils가 기본적으로 64비트 코드를 생성하므로 32비트 실행 파일을 위해 설정
`-T elf_i386.x`: elf_i386.x 링커 스크립트를 이용해서 링크 수행
`-o Main.elf`: 링크하여 생성할 파일 이름

.text 섹션만 `0x10200`으로 이동 시키면 다음 .data와 .bss같은 섹션은 자동으로 이후에 생성되기 때문에 지정하지 않아도 된다.
```
.text 0x10200          : /* .text 섹션을 0x10200에 로딩하도록 지정 */
```

ENTRY() 를 사용하여 엔트리 포인트 지정
```
ENTRY(Main) /* Main 함수를 엔트리 포인트로 지정 */
```
사실 엔트리 포인트를 링커에 지정하는 작업은 빌드의 결과물이 OS에 의해 실행 가능한 파일 포맷(리눅스 elf, 윈도우 PE)일 때만 의미가 있다. 
실행 파일을 바이너리 형태로 변환하는 MINT64 OS의 경우는 엔트리 포인트 정보가 제거되므로 엔트리 포인트는 큰 의미가 없다.

하지만 앞에서 보호 모드 엔트리 포인트는 0x10200 어드레스로 이동(jmp)하므로, 엔트리 포인트를 해당 어드레스에 강제로 위치시켜야 한다.
이를 위해서는 두 가지 순서를 조작해야 한다.

1. 오브젝트 파일 내의 함수 간의 순서
2. 실행파일 내의 함수 간의 순서

소스 파일 내의 함수 위치와 오브젝트 파일의 순서를 변경하는 방법을 알았으니 나머지는 나중에 실제 코드를 통해 알아보겠다.

## 실행 파일을 바이너리 파일로 변환

컴파일과 링크 과정을 거쳐 생성된 실행 파일은 코드 섹션과 데이터 섹션 이외의 정보를 포함하고 있으므로 이를 objcopy 프로그램을 사용하여 제거해 보자.
(binutils 에 포함되어 있다.)

**objcopy로 바이너리 파일 변환**

```
x86_64-pc-linux-objcopy -j .text -j .data -j .rodata -j .bss -S -O binary Kernel32.elf Kernel32.bin
```
`-j`: 센션 추출
`-S`: 재배치 정보와 심볼 정보 제거
`-O`: 생성한 파일 포맷