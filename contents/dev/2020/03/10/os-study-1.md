# OS 개발 따라하기 시작

지금부터 ebook으로 구매한 [64비트 멀티코어 OS 원리와 구조](https://www.aladin.co.kr/shop/common/wseriesitem.aspx?SRID=647682)보고 OS 개발을 따라가 볼 것이며 
이 책의 가장 큰 장점은 초반부터 바로 개발환경을 세팅하고 만들어 가며 설명을 해주기 때문에 지루할 틈이 없다는 것이다.
(총 2권으로 이루어져 있으며 최종적으로 64비트이며 GUI까지 갖고있는 OS를 만들 수 있다고 한다.)

내가 책을 구매하고 초반에 열심히 그리고 재미있게 개발을 하며 티스토리에 정리도 했지만 다사다난한 시기를 보내며 해야된다는 생각만 하고 하지 않았다.
이제 다시 안정기를 찾아 마음을 다잡고 마무리를 지어보기 위해 달려볼 것이다.

## 앞으로 개발되는 소스는 [Github의 OS Study](https://github.com/KNero/os-study)에 올라갈 예정이다. 여기의 남기는 소스는 log 정도로만 생각하면 된다.

### 개발환경을 구성하자
우선 책에서는 **windows** 에서 **gcc(GNU Compiler Collection)** 나 기타 유틸리티를 기본적으로 제공해 주는 리눅스환경을 만들기 위해 **Cygwin** 을 사용하는데
나는(Mac 을 사용) OS 를 빌드하고 실행하는 독립된 환경을 구성해 보고 싶어서 `Docker` 를 선택했다.

#### 1. Docker 를 다운받는다. => [도커홈페이지](https://www.docker.com/products/docker-desktop)

#### 2. OS 는 내가 가장 많이 사용해보고 익숙한 우분투를 선택했으며 우분투 이미지를 받아준다.
`docker pull ubuntu:16.04`

#### 3. 이미지를 컨테이너로 실행을 시키는데 소스와 결과물을 공유하기 위해서 특정 폴더를 공유한다.(-v 옵션 사용)
`docker run --name ubuntu -d -v /Users/kwonsm/Documents/workspace:/home/ubuntu -i -t ubuntu:16.04 /bin/bash`

#### 4. 이제 컨테이너에 접속한다. (컨테이너 이름을 통해서 접속)
`docker exec -i -t ubuntu bash`

#### 5. 이제 컴파일을 위해 gcc 를 설치해준다. (gcc 명령어를 실행했을 경우 없다면 설치하면 되는데 기본 우분투 이미지에는 없다)
`apt-get install gcc`

#### 6. 그리고 vim 도 없으므로 설치해 준다.
`apt-get install vim`

`3` 에서 workspace 를 연결해 두었기 때문에 개발은 맥환경에서 하고 빌드&실행은 우분투에서 하게 될 것이다. 우선 gcc 의 크로스컴파일 확인을 위해
`test.c` 를 작성하고 빌드해보자. (코드를 우분투의 `vim` 을 사용해서 해도 되지만 난 그렇게 하지 않을 것이다.)

```c
#include <stdio.h>

int main(int argc, char** argv)
{
    printf("Hello, world\n");
    return 0;
}
```
그리고 우분투에서 빌드
```
gcc -m32 -o test32 test.c (32비트 컴파일)
gcc -m64 -o test64 test.c (64비트 컴파일)
```
빌드를 완료하고 test32, test64 파일이 같은 디렉터리에 있다면 테스트가 성공한 것이며 물론 성공을 확인하고 실행도 해볼 수 있다.
(Hello, world 출력)
```
./test32
./test64
```
크로스 컴파일이 실패하면 책에서는 크로스 컴파일러는 만드는 과정이 추가로 있고 윈도우에 Cygwin 환경이라 더 복잡하고 어려워보였다.

#### 7. NASM 설치
`apt-get install nasm`
어셈블러는 부팅할 때 잠깐 필요하다고 하며 개발을 위해 nasm(The Netwide Assembler) 을 설치한다. (gcc 와 마찬가지로 32, 64비트 모두 지원하며 오픈소스이다)
정상적으로 설치가 됐는지 확인해 보자.
```
root@5451454460bb:/# nasm -version
NASM version 2.11.08
```

#### 8. QEMU 설치
다양한 종류의 프로세스를 소프트웨어적으로 구현한 프로그램으로 x86, x86_64, ARM 등 다양한 프로세스를 지원하고 멀티코어 에뮬레이션을 지원하는 오픈소스이다.
`apt-get install qemu`
```
root@5451454460bb:/usr/bin# ls | grep qemu
qemu-aarch64
qemu-alpha
qemu-arm
qemu-armeb
qemu-cris
...

root@5451454460bb:/home/ubuntu# qemu-system-x86_64 -version
QEMU emulator version 2.5.0 (Debian 1:2.5+dfsg-5ubuntu10.33), Copyright (c) 2003-2008 Fabrice Bellard
```
책에서는 집필 당시 `0.10.4` 버전에 맞춰서 OS 기능을 시험했으며 가장 근접한 `0.15.92` 버전을 사용하는 것이 좋다고 했지만 구하기 너무 힘들었으므로 최신버전을 설치했다.
나중에 문제가 된다면 그때가서 트러블 슈팅을 열심히 할 예정다.(난 남자니까)

여기까지 OS 개발 준비가 모두 끝났다. 
`Docker`라는 좋은 환경에서 어려운 과정들을 쉽게 해결했다는 사실이 신기하다.
