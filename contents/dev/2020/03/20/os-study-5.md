# 부트 로더를 만들어 보자

## 앞으로 개발할 OS 의 디렉터리 구조

```
MINT64
  |
  |---- 00.BootLoader : 부트 로더
  |---- 01.Kernel32 : 보호 모드 커널
  |           |
  |           |---- Source : 소스 파일
  |           |---- Temp : 빌드 과정에서 생성되는 임시 파일
  |
  |---- 02.Kernel64 : IA-32e 모드 커널
  |           |
  |           |---- Source : 소스 파일
  |           |---- Temp : 빌드 과정에서 생성되는 임시 파일
  |
  |---- 03.Application : IA-32e 모드 응용프로그램과 관련된 디렉터리
  |           |
  |           |---- 00.HelloWorld : 응용프로그램별 디렉터리
  |                       ...
  |
  |---- 04.Utility : OS와 관련된 유틸리티 프로그램
              |
              |---- 00.ImageMaker : 유틸리티별 디렉터리
                          ...
```

디렉터리 준비가 끝났다면 이제 OS 이미지 빌드에 필요한 make 파일을 생성하자

## makefile

make 프로그램은 소스 파일을 이용해서 자동으로 실행 파일 또는 라이브러리 파일을 만들어주는 빌드 관련 유틸리티이다. make 프로그램은 소스 파일과 목적 파일을 비교한 뒤 마지막 빌드 후에 수정된 파일만 선택하여 빌드를 수행하므로 빌드 시간을 크게 줄여준다. make 프로그램이 빌드를 자동으로 수행하려면 각 소스 파일의 의존 관계나 빌드 순서, 빌드 옵션 등에 대한 정보가 필요한데 이 내용이 저장된 파일이 makefile 이다.

**기분 문법**
```
Target: Dependency ...
<tab> Command
<tab> Command
<tab> ...
```

- Target : 생성할 파일. 특정 label 을 지정하여 해당 label과관련된 부분만 빌드하는 것도 가능
- Dependency : Target 생성에 필요한 소스 파일이나 오브젝트 파일 등
- Command : 명령창이나 터미널에서 실행할 명령 또는 프로그램을 기술

(tab 은 공백이 아닌 꼭 tab 문자로 띄어야 한다.)

**예제**
```
# a.c, b.c 를 통해서 output.exe 파일을 생성한다. (코멘트)

all: output.exe # 별다른 옵션이 없을 때 기본적으로 생성하는 Target 을 기술

a.o: a.c
<tab>gcc -c a.c

b.o: b.c
<tab>gcc -c b.c

output.exe: a.o b.o
<tab>gcc -o output.exe a.o b.o
```

make 는 최정으로 생성할 Target 의 의존성을 추적하면서 빌드를 처리하기 때문에 makefile 은 역순으로 따라가면 된다. all 은 Target 을 명시하지 않을 경우 기본적으로 사용하는 Target 이다.
최상위 디렉터리의 하위의 Library 디렉터리가 있고, 빌드 과정에서 Library 디렉터리르 빌드해야 한다면 `-C` 옵션을 사용해서 처리한다.

output.exe 를 빌드하기 위해서는 a.o, b.o 가 필요하고 a.o는 다시 a.c 파일을 사용하여 커맨드를 실행하며 b.o는 b.c 파일을 사용하여 커맨드를 실행하게 된다. 그리고 이렇게 a.o, b.o 가 생성되면 output.exe 의 커맨드를 실행하게 되는 것이다.

**예제(계층적 빌드)**
```
# output.exe 를 빌드
all: output.exe

# Library 디렉터리로 이동한 후 make를 수행
libtest.a:
<tab>make -C Libaray

output.o: output.c
<tab>gcc -c output.c

output.exe: libtest.a output.o
<tab>gcc -o output.exe output.c -ltest -L./
```

## MINT64용 makefile 생성

최상의 폴더인 `MINT64` 에 `makefile` 이라는 이름의 파일을 생성해 준다.

```
all: BootLoader Disk.img

BootLoader:
	@echo
	@echo =================== Build Boot Loader ===================
	@echo

	make -C 00.BootLoader

	@echo
	@echo =================== Build Complete ===================
	@echo

Disk.img: 00.BootLoader/BootLoader.bin
	@echo
	@echo =================== Disk Image Build Start ===================
	@echo

	cp 00.BootLoader/BootLoader.bin Disk.img

	@echo
	@echo =================== All Build Complete ===================
	@echo

clean:
	make -C 00.BootLoader clean
	rm -f Disk.img
```

최상의 makefile 의 목적은 OS 이미지 생성을 위해 각 하위 디렉터리의 makefile을 실행하는 것이지만 지금은 부트 로더만 있으므로 해당 디렉터리로 이동해서 빌드하고 결과물을 복사하여 OS 이미지를 생성하는 것이 전부이다. (@echo 는 문자열을 출력해 준다. cp 는 파일 복사 명령어, rm 은 파일 삭제 명령어 이다.)

이제 최상위의 makefile 을 생성했으니 **00.BootLoader 디렉토리 안에 makefile 을 생성**해 주자.

```
all: BootLoader.bin

BootLoader.bin: BootLoader.asm
	nasm -o BootLoader.bin BootLoader.asm

clean:
	rm -f BootLoader.bin
```

부트 로더의 makefile 의 목적은 BootLoader.asm 파일을 nasm 어센블리어 컴파일러로 빌드하여 BootLoader.bin 파일을 생성하는 것이다.
`clean` 을 통해 빌드 중 생성된 bin 파일을 삭제 한다.

최상위에서 폴더에서 `make` 실행했지만 명령어를 찾을 수 없다고 나왔고 `build-essential`을 설치했다.

```
apt-get install build-essential
```

그리고 실행하면 당연히 **BootLoader.asm**이 없기 때문에 에러가 발생한다. 

![success error bootloader](//knero.github.io/contents/dev/2020/03/20/image/os-study-5-1.png)

이제 BootLoader.asm 파일을 추가해 보자.

**BootLoader.asm
```
[ORG 0x00]  ; 코드의 시작 어드레스를 0x00 으로 설정
[BITS 16]   ; 이하의 코드는 16비트 코드로 설정

SECTION .txt    ; text 섹션(세그먼트)을 정의

jmp $   ; 현재 위치에서 무한 루프 수행

times 510 - ( $ - $$ )  db  0x00    ; $: 현재 라인의 어드레스
                                    ; $$: 현재 섹션 (.text)의 시작 어드레스
                                    ; $ - $$ : 현재 섹션을 기준으로 하는 오프셋
                                    ; 510 - ( $ - $$ ): 현재부터 어드레스 510 까지
                                    ; db 0x00: 1바이트를 선언하고 값은 0x00
                                    ; time: 반복 수행
                                    ; 현재 위치에서 어드레스 510 까지 0x00 으로 채움

db 0x55 ; 1 바이트를 선언하고 값은 0x55
db 0xAA ; 1 바이트를 언언하고 값은 0xAA
        ; 어드레스 511, 512 에 0x55, 0xAA 를 써서 부트섹터로 표기함
```

- ORG 0x00: 코드의 시작 어드레스를 0x00 으로 설정
- BITS 16: 이하의 코드는 16비트 코드로 설정
- SECTION .txt: text 섹션(세그먼트)을 정의
- jmp $: 현재 위치에서 무한 루프 수행. C 언어의 ```A: go A:``` 또는 ```while(1);``` 과 같은 의미
- jmp: jmp 명령 다음에 오는 어드레스로 무조건 이동. C언어의 goto와 같은 역할
- $: 현재 라인의 어드레스를 의미
- times 510 - ( $ - $$ ): 현재 어드레스부터 어드레스가 510이 되는 시점까지 작업을 반복 수행
- times: times 명령 다음에 오는 횟수만큼 작업을 반복하라는 의미
- $$: 현재 어드레스가 포함된 섹션의 시작 어드레스
- $ - $$: 섹션의 시작을 기준으로 하는 오프셋
- db 0x00: 현재 어드레스에 1바이트 크기의 0x00을 삽입하라는 의미, Define Byte의 약자
- db: 현재 어드레스에 값을 할당하고 저장. db(1byte), dw(2byte), dd(4byte), dq(8byte) 등이 있음
- **db 0x55, db 0xAA: 부트로더임을 알리는 값**

이제 다시 빌드를 해보면 Disk.img 파일이 생성되는 것을 볼 수 있다.

![success build bootloader](//knero.github.io/contents/dev/2020/03/20/image/os-study-5-2.png)

생성된 이미지를 qemu 를 통해서 실행해보자. (qemu 는 공부 첫 날)[https://knero.github.io/#/contents?path=/contents/dev/2020/03/10/os-study-1.md&date=2020.03.10]에 설치했다.

책의 예제에서는 `-M pc` 사용하여 pc 모드로 실행했지만 지금의 우분투는 그래픽이 없기 때문에 옵션을 바꿔서 실행했다. 그리고 플로피 디스크를 사용하지 않기 때문에 `-fda` 를 `-hda` 변경해 주었다. (-m 64 는 64M 의 메모리를 사용한다는 의미)

**책 예제**
```
qemu-system-x86_64.exe -L . -m 64 -fda c:/MINT64/Disk.img -localtime -M pc
```

**내가 실행한 명령어**
```
qemu-system-x86_64 -L . -m 64 -hda ./Disk.img -localtime -display curses
```
![success booting](//knero.github.io/contents/dev/2020/03/20/image/os-study-5-3.png)

지금 만든 부트로더는 무한 루프를 실행하는 것 말고는 하는 것이 없으므로 멈춰있는 것을 볼 수 있다. 
만약 부트 로더가 실패하는 것을 보고 싶다면 마지막에 0x55, 0xAA 를 0x00, 0x00 으로 수정해 확인할 수 있다.
**실행을 중단하고 싶을 경우 창을 하나 더 열어 도커에 접속한 뒤 ps -ef 로 pid 를 확인하고 kill 해준다.**