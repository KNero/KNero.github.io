# 커널 빌드 자동화

앞서 우리는 `makefile`을 수정해서 파일을 소스 파일을 추가하면 자동으로 빌드해서 `Disk.img`가 생성되도록 수정했다.
하지만 `Kernel32.bin`의 크기에 따라서 `BootLoader.asm`파일의 `TOTALSECTORCOUNT` 값을 수정해줘야 했다.
이제는 `TOTALSECTORCOUNT`도 자동으로 변경될 수 있도록 수정해 볼 것이다.

수정하기 위해서는 `BootLoader.bin`파일의 hex 값을 확인해서 `TOTALSECTORCOUNT`의 위치를 확인해야한다.
우분투 도커에 접속해서 os가 있는 디렉터리로 이동한 후 `xxd`를 사용하여 파일의 hex 값을 확인해 보자

![bootloader hex](/contents/dev/2020/04/14/image/os-study-15-1.png)

첫 줄의 데이터를 보면
```
00000000: ea07 00c0 0702 00
```
부분이 있는데 `ea07 00c0 07`은 `jmp 0x7c0: START`이고 `02 00`은 `dw 0x2` 이다.
이제 위치를 파악했으니 이 정보를 수정하는 이미지 메이커를 만들어 보겠다.

**04.Utility/00.ImageMaker/makefile**
```
all: ImageMaker.exe

ImageMaker.exe: ImageMaker.c
	gcc -o $@ $<

clean: rm -f ImageMaker.exe
```

**04.Utility/00.ImageMaker/ImageMaker.c**
```
#include <stdio.h>
#include <stdlib.h>
#include <fcntl.h>
#include <sys/uio.h>
#include <sys/types.h>
#include <sys/stat.h>
#include <errno.h>

#define BYTESOFSECTOR 512

int AdjustInSectorSize(int iFd, int iSourceSize);
void WriteKernelInformation(int iTargetFd, int iKernelSectorCount);
int CopyFile(int iSourceFd, int iTargetFd);

int main(int argc, char* argv[])
{
	int iSourceFd;
	int iTargetFd;
	int iBootLoaderSize;
	int iKernel32SectorCount;
	int iSourceSize;

	if (argc < 3)
	{
		fprintf(stderr, "[ERROR] ImageMaker.exe BootLoader.bin Kerner32.bin\n");
		exit(-1);
	}

	// Dist.img 파일을 생성
	if ((iTargetFd = open("Disk.img", O_RDWR | O_CREAT | O_TRUNC, S_IREAD | S_IWRITE)) == -1)
	{
		fprintf(stderr, "[ERROR] Disk.img open fail.\n");
		exit(-1);
	}

	// 부트 로더 파일을 열어서 모든 내용을 디스크 이미지 파일로 복사
	printf("[INFO] Copy boot loader to image file\n");

	if ((iSourceFd = open(argv[1], O_RDONLY)) == -1)
	{
		fprintf(stderr, "[ERROR] %s open fail\n", argv[1]);
		exit(-1);
	}

	iSourceSize = CopyFile(iSourceFd, iTargetFd);
	close(iSourceFd);

	// 파일 크기를 섹터 크기인 512바이트로 맞추기 위해 나머지 부분을 0x00으로 채움
	iBootLoaderSize = AdjustInSectorSize(iTargetFd, iSourceSize);
	printf("[INFO] %s size = [%d] and sector count = [%d]\n", argv[1], iSourceFd, iBootLoaderSize);

	// 32비트 커널 파일을 열어서 모든 내용을 디스크 이미지 파일로 복사
	printf("[INFO] Copy protected mode kernel to image file\n");

	if ((iSourceFd = open(argv[2], O_RDONLY)) == -1)
	{
		fprintf(stderr, "[ERROR] %s open fail\n", argv[2]);
		exit(-1);
	}

	iSourceSize = CopyFile(iSourceFd, iTargetFd);
	close(iSourceFd);

	// 파일 크기를 섹터 크기인 512바이트로 맞추기 위해 나머지 부분을 0ㅌ00으로 채움
	iKernel32SectorCount = AdjustInSectorSize(iTargetFd, iSourceSize);
	printf("[INFO] %s size = [%d] and sector count = [%d]\n", argv[2], iSourceFd, iKernel32SectorCount);

	// 디스크 이미지에 커널 정보를 갱신
	printf("[INFO] Start to write kernel information\n");
	// 부트섹터의 5번째 바이트 부터 커널에대한 정보를 넣음
	WriteKernelInformation(iTargetFd, iKernel32SectorCount);
	printf("[INFO] Image file create complete\n");

	close(iTargetFd);
	return 0;
}

// 현재 위치부터 512바이트 개수 위치까지 맞추어 0x00으로 채움
int AdjustInSectorSize(int iFd, int iSourceSize)
{
	int i;
	int iAdjustSizeToSector;
	char cCh;
	int iSectorCount;

	iAdjustSizeToSector = iSourceSize % BYTESOFSECTOR;
	cCh = 0x00;

	if (iAdjustSizeToSector != 0)
	{
		iAdjustSizeToSector = 512 - iAdjustSizeToSector;

		printf("[INFO] File size [%lu] and fill [%u] byte\n", iSourceSize, iAdjustSizeToSector);

		for (i = 0; i < iAdjustSizeToSector; i++)
		{
			write(iFd, &cCh, 1);
		}
	}
	else
	{
		printf("[INFO] File size is aligned 512 byte\n");
	}

	// 섹터 수를 되돌려줌
	iSectorCount = (iSourceSize + iAdjustSizeToSector) / BYTESOFSECTOR;
	return iSectorCount;
}

void WriteKernelInformation(int iTargetFd, int iKernelSectorCount)
{
	unsigned short usData;
	long lPosition;

	// 파일의 시작에서 5바이트 떨어진 위치가 커널의 총 섹터 수 정보를 나타냄 
	lPosition = lseek(iTargetFd, (off_t)5, SEEK_SET);
	if (lPosition == -1)
	{
		fprintf(stderr, "lseek fail. Return value = %d, errno = %d, %d\n", lPosition, errno, SEEK_SET);
		exit(-1);
	}

	usData = (unsigned short)iKernelSectorCount;
	write(iTargetFd, &usData, 2);

	printf("[INFO] Total sector count except boot loader [%d]\n", iKernelSectorCount);
}

// 소스 파일(Source FD)의 내용을 목표 파일(Target FD)에 복사하고 그 크기를 되돌려줌
int CopyFile(int iSourceFd, int iTargetFd)
{
	int iSourceFileSize;
	int iRead;
	int iWrite;
	char vcBuffer[BYTESOFSECTOR];

	iSourceFileSize = 0;
	while (1)
	{
		iRead = read(iSourceFd, vcBuffer, sizeof(vcBuffer));
		iWrite = write(iTargetFd, vcBuffer, iRead);

		if (iRead != iWrite)
		{
			fprintf(stderr, "[ERROR] iRead != iWrite...\n");
			exit(-1);
		}

		iSourceFileSize += iRead;

		if (iRead != sizeof(vcBuffer))
		{
			break;
		}
	}

	return iSourceFileSize;
}
```

변경한 점은 인터넷에서 찾아보니 리눅스에서는 `io.h`가 없으므로 'sys/uio.h' 를 사용해야 한다고 해서 수정했고
`O_BINARY`가 없어서 `open` 메소드에서 모두 제거해 줬다. 그리고 `04.Utility`에서 make 를 실행하면 warning이 출력되면서 ImageMaker.exe 가 생성된다.

**최상단의 makefile**
```
...생략...

Disk.img: 00.BootLoader/BootLoader.bin 01.Kernel32/Temp/Kernel32.bin

	@echo
	@echo ================ Disk Image Build Start ================
	@echo

	./04.Utility/00.ImageMaker/ImageMaker.exe $^

	@echo
	@echo ================ All Build Complete ================
	@echo

...생략...
```

최상단의 makefile 에서 ImageMaker.exe를 사용하도록 수정했다. 책에서는 exe 파일을 최상단으로 복사해서 사용했지만 생성된 위치에서 그대로 사용하도록 했다.
make를 실행하면 ImageMaker의 로그를 볼수 있고 정상적으로 부팅되는 것을 볼수 있다.

![imagemaker log](/contents/dev/2020/04/14/image/os-study-15-2.png)

![booting success](/contents/dev/2020/04/14/image/os-study-15-3.png)