# IA-32e 모드용 세그먼트 디스크립터 추가

IA-32e 모드의 세그먼트 디스크립터는 보호 모드의 세그먼트 디스크립터와 거의 같은 크기와 필드로 구성되어 있기 때문에 코드 디스크립터와 데이터 디스크립터를 생성하는 방법이 보호 모드와 유사하다.
하지만 IA-32e 모드에서는 디스크립터의 기준 주소와 세그먼트 크기 값에 상관없이 64GB 전체 영역으로 설정된다는 것과 세그먼트 디스크립터의 L비트가 IA-32e 서브 모드 중 호환 모드 또는 64 비트 모드를
선택하는 데 사용된다는 차이점이 있다. ([보호 모드 세그먼트 디스크립터](https://knero.github.io/#/contents?path=/contents/dev/2020/04/01/os-study-9.md&date=2020.04.01&page=2){:target="_blank"})

![IA-32e segment descriptor](/contents/dev/2020/04/27/image/os-study-23-1.png)

IA-32e 모드의 서브 모드 중에서 64비트 모드를 사용할 것이므로, 보호 모드용 세그먼트 디스크립터 기반으로 L 비트를 1, D 비트를 0으로 설정하면 된다. 
D 비트를 0으로 설정하는 이유는 L 비트와 D 비트가 모두 1인 경우를 다른 목적으로 예약해두었기 때문이다.
실제 PC에서는 L 비트와 D 비트를 모두 1로 설정하면 리부팅될 수 있다.

**IA-32e 모드 커널용 코드와 데이터 세그먼트 디스크립터 코드**
```
GDT:
    ; NULL 디스크립터, 반드시 0으로 초기화해야 함
    NULLDescriptor:
        dw 0x0000
        dw 0x0000
        dw 0x00
        dw 0x00
        dw 0x00
        dw 0x00

    ; IA-32e 모드 커널용 코드 세그먼트 디스크립터
    IA_32eCODEDESCRIPTOR:
        dw 0xFFFF    ; Limit[15:0]
        dw 0x0000    ; Base [15:0]
        db 0x00      ; Base [23:16]
        db 0x9A      ; P=1, DPL=0, Code Segment, Execute/Read
        db 0xAF      ; G=1, D=0, L=1, Limit[19:16]
        db 0x00      ; Base [31:24]

    ; IA-32e 모드 커널용 데이터 세그먼트 디스크립터
    IA_32eDATADESCRIPTOR:
        dw 0xFFFF    ; Limit[15:0]
        dw 0x0000    ; Base [15:0]
        db 0x00      ; Base [23:16]
        db 0x92      ; P=1, DPL=0, Data Segment, Execute/Read
        db 0xAF      ; G=1, D=0, L=1, Limit[19:16]
        db 0x00      ; Base [31:24]
    ; IA-32e 모드 커널용 코드 세그먼트 디스크립터와 데이터 세그먼트 디스크립터, 상위 4바이트에 위치하는 L 비트=1로 D 비트=0으로 설정함

    ; 보호 모드 커널용 코드 세그먼트 디스크립터
    CODEDESCRIPTOR:
        dw 0xFFFF    ; Limit[15:0]
        dw 0x0000    ; Base [15:0]
        db 0x00      ; Base [23:16]
        db 0x9A      ; P=1, DPL=0, Code Segment, Read/Write
        db 0xCF      ; G=1, D=1, L=0, Limit[19:16]
        db 0x00      ; Base [31:24]

    ; 보호 모드 커널용 데이터 세그먼트 디스크립터
    DATADESCRIPTOR:
        dw 0xFFFF    ; Limit[15:0]
        dw 0x0000    ; Base [15:0]
        db 0x00      ; Base [23:16]
        db 0x92      ; P=1, DPL=0, Data Segment, Read/Write
        db 0xCF      ; G=1, D=1, L=0, Limit[19:16]
        db 0x00      ; Base [31:24]
GDTEND:
```

IA-32e 모드용 세그먼트 디스크립터가 보호 모드용 세그먼트 디스크립터의 앞에 있으므로 보호 모드로 전환할 때 사용했던 세그먼트 셀렉터의 값을 변경해 줘야한다.

**세그먼트 디스크립터 오프셋 변경 01.Kernel32/Source/EntryPoint.s**
```
... 생략 ...

    ; 커널 코드 세그먼트를 0x00을 기준으로 하는 것으로 교체하고 EIP의 값을 0x00을 기준으로 재설정
    ; CS 세그먼트 셀렉터 : EIP
    ; 보호 모드 커널용 코드 세그먼트 디스크립터를 0x18로 이동
    jmp dword 0x18: (PROTECTEDMODE - $$ + 0x10000)
    ; $$는 $$를 포함하는 세그먼트의 시작 어드레스를 나타내므로 .text 섹션의 시작 어드레스를 의미
    ; PROTECTEDMODE - $$: PROTECTEDMODE 레이블에서 현재 세그먼트의 시작 어드레스를 뺐으므로 .text 섹션에서 떨어진 오프셋을 나타냄
    ; PROTECTEDMODE - $$ + 0x10000: 실제로 보호 모드 엔트리 포인트는 0x10000 어드레스에 로딩되므로 PROTECTEDMODE - $$ 에 0x10000을 더해주면
    ;                               PROTECTEDMODE 레이블의 절대 어드레스를 구할 수 있음

; 보호 모드로 진입
[BITS 32]           ; 이하의 코드는 32비트 코드로 설정
PROTECTEDMODE:
    mov ax, 0x20    ; 보호 모드 커널용 데이터 세그먼트 디스크립터를 AX 레지스터에 저장

... 생략 ...

    jmp dword 0x18: 0x10200    ; C 언어 커널이 존재하는 0x10200 어드레스로 이동하여 C 언어 커널 수행
```

이제 `EntryPorint.s`의 소스를 변경했으니 IA-32e 모드 전환으로 넘어가 보자.