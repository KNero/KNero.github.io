#IA-32e 모드 전환과 정리

## 물리 메모리 확장 기능 활성화와 페이지 테이블 설정

물리 메모리 확장(PAE, Physical Address Extension) 기능은 CR4 레지스터의 PAE 비트(비트 5)가 담당하고 있으며, PAE 비트를 1로 설정해서 물리 메모리 확장 기능을 사용할 수 있다.
그리고 프로세서에 페이지 테이블을 설정하려면 CR3 레지스터에 PML4 테이블의 어드레스를 저장하면 된다.

관련 설명은 <a href="https://knero.github.io/#/contents?path=/contents/dev/2020/04/22/os-study-20.md" target="_blank">페이지 테이블 생성과 페이징 기능 활성화</a> 의 내용에 나와있으며 맨 하단의 **프로세서의 페이징 기능을 활성화하는 코드** 에 구현되어 있다.

IA-32e 모드를 활성화하기 위해서는 `IA32_EFER` 레지스터의 LME 비트를 1로 설정하는 것이다. 이를 하지 않으면 IA-32e 모드용 세그먼트 레지스터로 교체한다 해도 32비트 보호 모드로 동작하게 된다.
`IA32_EFER`은 범용 또는 컨트롤 레지스터가 아니며, MSR(Model-Sepcific Register)라고 불리는 특수한 용도의 레지스터이다. 
이것은 프로세서 모델에 따라 특수하게 정의된 레지스터로 크기는 64비트 이며 모델에 따라 차이가 있다.

**MSR 레지스터의 종류(크게 6가지)**

- 디버깅 및 성능 측정(Debugging And Performance Monitoring)
- 하드웨어 에러 검사(Machine-Check)
- 메모리 범위와 메모리 타입 설정(Memory Type Range Register, MTRRs)
- 온도와 전력 관리(Thermal And Power Management)
- 특수 명령어 지원(Instruction-Specific Support)
- 프로세서 특성과 모드 지원(Processor Feature/Mode Support)

IA-32e 모드 전환에 사용할 `IA32_EFER(Extended Feature Enable Register)` 레지스터는 프로세서 특성과 모드 지원에 속하는 MSR 레지스터로 프로세서의 확장 기능을 제어할 수 있는 레지스터이다.
IA32_EFER 레지스터로 제어할 수 있는 항목에는 SYSCALL/SYSRET 사용, IA-32e 모드 사용, Execute Disable(EXB) 사용 등이 있으며, 제어 기능 외에 현재 운영 중인 모드가 IA-32e 모드인지 확인하는 기능도 포함하고 있다.

MSR 레지스터에 접근하려면 `RDMSR(Read From Model Specific Register)`과 `WRMSR(Write To Model Specific Register)`을 사용해야 한다.
여기서 사용할 IA32_EFER 레지스터는 `0xC0000080` 어드레스에 있다.

**IA32_EFER 레지스터의 비트 구성**

63~12비트

- 제조사마다 차이가 있음

11비트

- 필드: NXE
- 읽기, 쓰기
- No-Execute Enable의 약자로 Execute Disable 비트를 사용할지 여부를 표시
- 1로 설정하면 페이지 엔트리의 EXB 비트값에 따라 실행 불가 기능이 활성화/비활성화 됨
- 0으로 설정하면 페이지 엔트리의 EXB 비트가 무시됨

10비트

- 필드: LMA
- 읽기 전용
- Long Model Active의 약자로 현재 동작 중인 모드가 IA-32e 모드인지 여부를 표시
- 1로 설정되면 프로세서 모드가 IA-32e 모드(호환 모드 또는 64비트 모드)임을 나타내며, 0으로 설정되면 프로세서 모드가 기타 모드임을 나타냄

9비트

- 예약된 영역

8비트

- 필드: LME
- 일기, 쓰기
- Long Mode Enable의 약자로 IA-32e 모드를 활성화함을 의미
- 1로 설정하면 프로세서의 IA-32e 모드를 활성화함을 나타내며, 0으로 설정하며 비활성화함을 나타냄

7~1비트
- 예약된 여역

0비트
- 필드: SCE
- 읽기, 쓰기
- System Call Enable의 약자로 SYSCALL, SYSRET 명령어를 사용할지 여부를 의미
- 1로 설정하면 SYSCALL, SYSRET 명령어를 사용함을 나타내며, 0으로 설정하면 사용하지 않음을 나타냄

**IA32_EFER 레지스터를 통한 IA-32e 모드 활성화**
```
; IA32_EFER.LME를 1로 설정하여 IA-32e 모드르 활성화
mov ecx, 0xC0000080 ; IA32_EFER MSR 레지스터의 어드레스를 저장
                    ; IA32_EFER 레지스터의 어드레스가 0xC0000080이므로 ECX 레지스터에 설정하여 RDMSR 명령으로 접근
rdmsr               ; MSR 레지스터 읽기

or eax, 0x0100      ; EAX 레지스터에 저장된 IA32_EFER MSR의 하위 32비트에서 LME 비트(비트 8)을 1로 설정
                    ; LME 비트가 비트 8에 있으므로 0x0100을 or하여 LME 비트를 1로 설정
wrmsr               ; MSR 레지스터에 쓰기
```

IA-32e 모드로 전환하는 마지막 작업은 CR0 레지스터를 변경하여 캐시와 페이징을 활성화하고서 세그먼트 셀렉터를 IA-32e 커널용으로 교체하는 것이다.
앞서 페이징 활성화, 세그먼트 교체하는 작없은 다루었기 때문에 캐시를 활성화하는 방법만 살펴보겠다.

초기화한 페이지 테이블의 `PCD` 비트와 `PWT` 비트는 페이징을 활성화했을 때만 유효하다. x86 계열의 프로세서에는 페이지 캐시 설정보다 우선하는 캐시 관련 비트가 있는데
그것은 `CR0` 컨트롤 레지스터의 `NW(Not Write-throught)` 비트(비트 29)와 `CD(Cache Disable)` 비트(비트 30) 이다.
캐시를 사용하려면 `NW`, `CD` 비트를 모두 0으로 설정해야 한다.

**캐시와 페이징 활성화, IA-32e 모드 전환, 세그먼트 셀렉터 초기화를 수행하는 코드**
```
; CR0 컨트롤 레지스터를 NW 비트(비트 29) = 0, CD 비트(비트 30) = 0, PG 비트(비트 31) = 1 로
; 설정하여 캐시 기능과 페이징 기능을 활성화
mov eax, cr0          ; EAX 레지스터에 CR0 컨트롤 레지스터를 저장
or eax, 0xE0000000    ; NW 비트(비트 29), CD 비트(비트 30), PG 비트(비트 31)을 모두 1로 설정
                      ; PG 비트는 페이징 활성화를 위해 설정했으며
                      ; 나머지 비트는 이후에 XOR 연산하여 0으로 변경하려고 1로 설정
xor eax, 0x60000000   ; NW 비트(비트 29)와 CD 비트(비트 30)을 XOR하여 0으로 설정
                      ; 1로 설정된 NW 비트와 CD 비트를 XOR하여 모두 0으로 변경, 프로세서의 캐시 활성화
mov cr0, eax          ; NW 비트 = 0, CD 비트 = 0, PG 비트 = 1로 설정한 값을 다시 CR0 컨트롤 레지스터에 저장

jmp 0x08:0x200000     ; CS 세그먼트 셀렉터를 IA-32e 모드용 코드 세그먼트 디스크립터로 교체하고 0x200000(2MB) 어드레스로 이동
                      ; CS 세그먼트 셀렉터는 mov 명령으로 접근할 수 없으므로 jmp를 통해 교체하고
                      ; IA-32e 모드 커널이 존재하는 0x200000(2MB)로 이동

; 0x200000(2MB) 어드레스에 위치하는 코드
[BITS 64]             ; 이하의 코드는 64비트 코드로 설정
; 기타 세그먼트 셀렉터를 IA-32e 모드용 데이터 세그먼트 디스크립터로 교체
mov ax, 0x10          ; IA-32e 모드 커널용 데이터 세그먼트 디스크립터를 AX 레지스터에 저장
mov ds, ax            ; DS 세그먼트 셀렉터에 설정
mov es, ax            ; ES 세그먼트 셀렉터에 설정
mov fs, ax            ; FS 세그먼트 셀렉터에 설정
mov gs, ax            ; GS 세그먼트 셀렉터에 설정

; 스택을 0x600000~0x6FFFFF 영역에 1MB 크기로 생성
mov ss, ax            ; SS 세그먼트 셀렉터에 설정
mov rsp, 0x6FFFF8     ; RSP 레지스터의 어드레스를 0x6FFFF8로 설정
mov rbp, 0x6FFFF8     ; RBP 레지스터의 어드레스를 0x6FFFF8로 설정

...생략...
```

지금까지 IA-32e 모드로 전환하기 위한 모든 단계를 알아보았다. 다음에 IA-32e 모드 커널을 준비하고 나서 OS 이미지에 통합하면 모든 작업이 끝난다.