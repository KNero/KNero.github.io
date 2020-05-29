# 테스트를 위한 가상 OS 이미지 생성

가상 OS 이미지는 여기서만 사용하며 정상 동작 여부만 확인할 것이기 때문에 실행되었다는 표시만 출력하는 기능으로 만들것이다.
자신의 섹터 번호를 화면 위치에 대응시켜서 0 ~ 9까지 번호를 출력한다면 화면에 출력된 문자의 위치와 수를 확인하여 정상여부를 판단할 수 있다.

가상 OS 이미지의 크기는 최종 OS 이미지와 같이 적어도 수백KB 정도는 되어야 하기 때문에 512KB(1024섹터) 크기로 만들어 볼 것이다.
1024 섹터나 되는 코드를 작성하기에는 어려움이 있기 때문에 NASM 의 전처리기(PreProcessor)를 사용할 것이다.
이 전처리기는 매크로(Macro), 조건(Condition), 반복(Loop) 구문을 지원하며, 변수 할당과 값 지정도 가능하다.

그럼 이제 앞장의 <a href="https://knero.github.io/#/contents?path=/contents/dev/2020/03/20/os-study-5.md" target="blank">디렉토리 구조</a>에서 `01.Kernel32/Source` 디렉터리에 가상 OS 소스파일로 사용할 VirtualOS.asm 파일을 생성하겠다.

#### VirtualOS.asm
```
[ORG 0x00]   ; 코드의 시작 어드레스를 0x00으로 설정
[BITS 16]    ; 이하의 코드는 16비트 코드로 설정

SECTION .txt ; text 섹션(세그먼트)를 정의

jmp 0x1000:START ; CS 세그먼트 레지스터리에 0x1000을 복사하면서, START 레이블로 이동

SECTORCOUNT: dw 0x0000  ; 현재 실행 중인 섹터 번호를 저장
TOTALSECTORCOUNT equ 1024   ; 가상 OS의 총 섹터 수. 최대 1152 섹터(0x90000 byte)까지 가능

;;;;;;;;;;;;;;;;;
;    코드 영역
;;;;;;;;;;;;;;;;;
START:
    mov ax, cs      ; CS 세그먼트 레지스터의 값을 AX 레지스터에 설정
    mov ds, ax      ; AX 레지스터의 값을 DS 세그먼트 레지스터에 설정
    mov ax, 0XB800  ; 비디오 메모리 어드레스인 0xB8000을 세그먼트 레지스터 값으로 변환
    mov es, ax      ; ES 세그먼트 레지스터에 설정

;;;;;;;;;;;;;;;;;;;;;;
;  각 섹터별로 코드를 생성
;;;;;;;;;;;;;;;;;;;;;;
%assign i   0           ; i라는 변수를 지정하고 0으로 초기화
%rep TOTALSECTORCOUNT   ; TOTALSECTORCOUNT 에 저장된 값만큼 아래 코드를 반복
    %assign i i + 1     ; i를 1증가

    ; 현재 실행 중인 코드가 포함된 섹터의 위치를 화면 좌표로 변환
    mov ax, 2               ; 한 문자를 나타내는 바이트 수(2)를 ax 레지스터에 설정
    mul word[SECTORCOUNT]   ; AX 레지스터와 섹터수를 곱함
    mov si, ax              ; 곱한 결과를 SI 레지스터에 설정

    ; 계산된 결과를 비디오 메모리에 오프셋으로 삼아 세 번째 라인부터 화면에 0을 출력
    mov byte[es: si + (160 * 2)], '0' + (i % 10)
    add word[SECTORCOUNT], 1    ; 섹터 수를 1 증가

    ; 마지막 섹터이면 더 수행할 섹터가 없으므로 무한 루프 수행, 그렇지 않으면
    ; 다음 섹터로 이동해서 코드 수행
    %if i == TOTALSECTORCOUNT            ; i가 TOTALSECTORCOUNT와 같다면, 즉 마지막 섹터이면 
        jmp $                            ; 현재 위치에서 무한루프
    %else                                ; 마지막 섹터가 아니면
        jmp (0x1000 + i * 0x20): 0x0000  ; 다음 섹터 오프셋으로 이동
    %endif                               ; if문의 끝

    times (512 - ($ - $$) % 512) db 0x00 ; $: 현재 라인의 어드레스
                                         ; $$: 현재 섹션 (.text)의 시작 어드레스
                                         ; $ - $$ : 현재 섹션을 기준으로 하는 오프셋
                                         ; 512 - ( $ - $$ ) % 512: 현재부터 어드레스 512 까지
                                         ; db 0x00: 1바이트를 선언하고 값은 0x00
                                         ; time: 반복 수행
                                         ; 현재 위치에서 어드레스 512 까지 0x00 으로 채움
%endrep                                  ;반복문의 끝
```

- times (512 - ($ - $$) % 512) db 0x00 : 각 섹터의 상위에 화면 추력 코드를 삽입하고 512바이트 단위로 정령하기 위해 남은 영역을 0으로 채움

이제 `01.Kernel32` 디렉터리에 makefile 을 생성해 준다.

```
all: VirtualOS.bin

VirtualOS.bin: Source/VirtualOS.asm
	nasm -o Temp/VirtualOS.bin Source/VirtualOS.asm

clean:
	rm -f Temp/VirtualOS.bin
```

마지막으로 전체를 빌드하는 가장 상위 폴더의 `makefile` 을 수정해 준다.

```
all: BootLoader Kernel32 Disk.img

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

Disk.img: BootLoader Kernel32

	@echo
	@echo ================ Disk Image Build Start ================
	@echo

	cat 00.BootLoader/BootLoader.bin 01.Kernel32/VirtualOS.bin > Disk.img

	@echo
	@echo ================ All Build Complete ================
	@echo

clean:
	make -C 00.BootLoader clean
	make -C 01.Kernel32 clean
	rm -f Disk.img
```

실행을 하면 아래와같이 표시될 것이다. 숫자들의 개수가 1024개임을 확인할 수 있으며 부트로더가 정상적으로 OS 이미지를 로딩했다는 것을 확인할 수 있다.

![virtual os booting](/contents/dev/2020/03/26/image/os-study-8-1.png)
