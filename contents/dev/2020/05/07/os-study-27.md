# ImageMaker 프로그램 수정

이전에 사용하던 ImageMaker 프로그램은 부트 로더 이미지 파일과 보호 모드 커널 이미지 파일, 두 가지만 결합할 수 있었다. 
또한 IA-32e 모드 커널을 0x200000(2MB) 어드레스의 위치로 복사하려면 IA-32e 모드 커널에 대한 위치 정보가 필요하다는 문제도 있다.

이 문제를 해결하려면 ImageMaker 프로그램을 수정하여 IA-32e 모드 커널 파일을 입력으로 받아들이게 하고, 
커널의 총 섹터 수 외에 보호 모드 커널의 섹터 수를 추가로 기록하도록 수정해야 한다.
그리고 보호 모드 커널은 부트 로더나 보호 모드 이미지에 기록된 정보를 이용하여 IA-32e 모드 커널을 0x200000 영역으로 이동시켜야 한다.

부트 로더 영역에는 2바이트 크기의 `TOTALSECTORCOUNT`가 있으며, ImageMaker 프로그램은 이 영역에 부트 로더를 제외한 나머지 영역의 섹터 수를 기록하낟.
따라서 `TOTALSECTORCOUNT` 영역 이후에 2바이트를 할당하여 보호 모드 커널 섹터 수를 저장하면, ImageMaker 프로그램에서 쉽게 찾을 수 있으며 보호 모드 커널에서도 쉽게 접근할 수 있을 것이다.
**수정된 부트 로더 파일(Bootloader.asm)**
```
...
; MINT64 OS에 관련된 환경 설정 값
TOTALSECTORCOUNT: dw 0x02    ; 부트 로더를 제외한 MINT64 OS 이미지의 크기. 최대 1152 세터 (0x90000byte) 까지 가능
KERNEL32SECTORCOUNT: dw 0x02 ; 보호 모드 커널의 총 섹터 수
...
```

**보호 모드 커널의 섹터 수를 기록하는 기능이 추가된 ImageMaker 소스 코드(04.Utility/00.ImageMaker/ImageMaker.c)**
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
void WriteKernelInformation(int iTargetFd, int iTotalKernelSectorCount, int iKernel32SectorCount);
int CopyFile(int iSourceFd, int iTargetFd);

int main(int argc, char* argv[])
{
	int iSourceFd;
	int iTargetFd;
	int iBootLoaderSize;
	int iKernel32SectorCount;
	int iKernel64SectorCount;
	int iSourceSize;

	if (argc < 4)
	{
		fprintf(stderr, "[ERROR] ImageMaker.exe BootLoader.bin Kerner32.bin Kernel64.bin\n");
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
	printf("[INFO] %s size = [%d] and sector count = [%d]\n", argv[2], iSourceSize, iKernel32SectorCount);

	// 64비트 커널 파일을 열어서 모든 내용을 디스크 이미지 파일로 복사
	printf("[INFO] Copy IA-32e mode kernel to image file\n");

	if ((iSourceFd = open(argv[3], O_RDONLY)) == -1)
	{
		fprintf(stderr, "[ERROR] %s open fail\n", argv[3]);
		exit(-1);
	}

	iSourceSize = CopyFile(iSourceFd, iTargetFd);
	close(iSourceFd);

	// 파일 크기를 섹터 크기인 512바이트로 맞추기 위해 나머지 부분을 0ㅌ00으로 채움
	iKernel64SectorCount = AdjustInSectorSize(iTargetFd, iSourceSize);
	printf("[INFO] %s size = [%d] and sector count = [%d]\n", argv[3], iSourceSize, iKernel64SectorCount);

	// 디스크 이미지에 커널 정보를 갱신
	printf("[INFO] Start to write kernel information\n");
	// 부트섹터의 5번째 바이트 부터 커널에대한 정보를 넣음
	WriteKernelInformation(iTargetFd, iKernel32SectorCount + iKernel64SectorCount, iKernel32SectorCount);
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

void WriteKernelInformation(int iTargetFd, int iTotalKernelSectorCount, int iKernel32SectorCount)
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

	usData = (unsigned short)iTotalKernelSectorCount;
	write(iTargetFd, &usData, 2);
	usData = (unsigned short)iKernel32SectorCount;
	write(iTargetFd, &usData, 2);

	printf("[INFO] Total sector count except boot loader [%d]\n", iTotalKernelSectorCount);
	printf("[INFO] Total sector count of protected mode kernel [%d]\n", iKernel32SectorCount);
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

이렇게 수정을 하고 빌드해서 `ImageMaker.exe` 파일을 생성해보자.
(makefile을 생성해 두었기 때문에 make 를 실행했다. 참고: [커널 빌드 자동화](https://knero.github.io/#/contents?path=/contents/dev/2020/04/14/os-study-15.md&date=2020.04.14&page=2))

# IA-32e 모드 커널 이미지 복사

IA-32e 모드 커널 이미지를 0x200000 어드레스로 복사하려면 먼저 IA-32e 모드 커널의 시작 어드레스부터 알아야 한다.
OS 이미지 파일 내에서 IA-32e 모드 커널은 보호 모드 커널의 직후에 위치하고 부트 로더는 OS 이미지 파일의 내용 그대로 0x10000(64KB)에 옮겨주므로 
이를 통해 IA-32e 모드 커널의 시작 어드레스와 크기를 계산할 수 있다.
```
보호 모드 커널 영역의 시작 어드레스: 0x10000(64KB)
부트 로더 영역에서 보호 모드 커널의 크기: KERNEL32SECTORCOUNT(주소: 0x7C05)
부트 로더 영역에서 전체 커널의 크기: TOTALSECTORCOUNT(주소: 0x7C07)

IA-32e 모드 커널 이미지 영역의 시작 주소: 0x10000 + (TOTALSECTORCOUNT - KERNEL32SECTORCOUNT)
```

커널의 총 섹터 수가 7이고 보호 모드 커널의 섹터수가 4라면, IA-32e 모드 커널의 크기는 3섹터이며 시작 어드레스 0x10000 에서 4섹터만큼 떨어진 (0x10000 + 512바이트 * 4)이 된다.

**보호 모드 커널의 C 언어 엔트리 포인트 소스 코드(01.Kernel32/Source/Main.c)**
```
#include "Types.h"
#include "Page.h"
#include "ModeSwitch.h"

void kPrintString( int iX, int iY, const char* pcString );
BOOL kInitializeKernel64Area(void);
BOOL kIsMemoryEnough(void);
void kCopyKernel64ImageTo2MByte(void);

// Main 함수
void Main( void )
{
	DWORD i;
	DWORD dwEAX, dwEBX, dwECX, dwEDX;
	char vcVendorString[13] = {0,};

	kPrintString(0, 3, "Protected Mode C Language Kernel Start.....................[Pass]");

	// 최소 메모리 크기를 만족하는 지 검사
	kPrintString(0, 4, "Minimum Memory Size Check...................[    ]");
	if (kIsMemoryEnough() == FALSE)
	{
		kPrintString(45, 4, "Fail");
		kPrintString(0, 5, "Not Enough Memory. MINT64 OS Requires Over 64Mbyte Memory~!!");
		while (1);
	}
	else
	{
		kPrintString(45, 4, "Pass");
	}

	// IA-32e 모드의 커널 영역을 초기화
	kPrintString(0, 5, "IA-32e Kernel Area Initialize...............[    ]");
	if (kInitializeKernel64Area() == FALSE)
	{
		kPrintString(45, 5, "Fail");
		kPrintString(0, 6, "Kernel Area Initailization Fail.");
		while (1);
	}
	kPrintString(45, 5, "Pass");

	// IA-32e 모드 커널을 위한 페이지 테이블 생성
	kPrintString(0, 6, "IA-32e Page Tables Initialize...............[    ]");
	kInitializePageTables();
	kPrintString(45, 6, "Pass");

	// 프로세서 제조사 정보 읽기
	kReadCPUID(0x00, &dwEAX, &dwEBX, &dwECX, &dwEDX);
	*(DWORD*)vcVendorString = dwEBX;
	*((DWORD*)vcVendorString + 1) = dwEDX;
	*((DWORD*)vcVendorString + 2) = dwECX;
	kPrintString(0, 7, "Processor Vender String.....................[             ]");
	kPrintString(45, 7, vcVendorString);

	//64비트 지원 유무 확인
	kReadCPUID(0x80000001, &dwEAX, &dwEBX, &dwECX, &dwEDX);
	kPrintString(0, 8, "64bit Mode Support Check....................[    ]");
	if (dwEDX & (1 << 29))
	{
		kPrintString(45, 8, "Pass");
	}
	else
	{
		kPrintString(45, 8, "Fail");
		kPrintString(0, 9, "This Processor does not support 64bit mode~!!");
		while(1);
	}

	// IA-32e 모드 커널을 0x200000(2MByte) 어드레스로 이동
	kPrintString(0, 9, "Copy IA-32e Kernel To 2M Address............[    ]");
	kCopyKernel64ImageTo2MByte();
	kPrintString(45, 9, "Pass");

	//IA-32e 모드로 전환
	kPrintString(0, 10, "Switch To IA-32e Mode");
	kSwitchAndExecute64bitKernel();

	while( 1 );
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

// IA-32e 모드용 커널 영역을 0으로 초기화
BOOL kInitializeKernel64Area(void)
{
	DWORD* pdwCurrentAddress;

	// 초기화를 시작할 어드레스인 0x100000(1MB)을 설정
	pdwCurrentAddress = (DWORD*)0x100000;

	// 마지막 어드레스인 0x600000(6MB)까지 루프를 돌면서 4바이트씩 0으로 채움
	while ((DWORD)pdwCurrentAddress < 0x600000)
	{
		*pdwCurrentAddress = 0x00;

		// 0으로 저장한 후 다시 읽었을 때 0이 나오지 않으면 해당 어드레스를
		// 사용하는데 문제가 생긴 것이므로 더이상 진행하지 않는다.
		if (*pdwCurrentAddress != 0)
		{
			return FALSE;
		}

		pdwCurrentAddress++;
	}

	return TRUE;
}

// MINT64 OS를 실행하기에 충분한 메모리를 가지고 있는지 체크
BOOL kIsMemoryEnough(void)
{
	DWORD* pdwCurrentAddress;

	// 0x100000(1MB)부터 검사 시작
	pdwCurrentAddress = (DWORD*)0x100000;

	// 0x4000000(64MB)까지 루프를 돌면서 확인
	while ((DWORD)pdwCurrentAddress < 0x4000000)
	{
		*pdwCurrentAddress = 0x12345678;

		// 0x12345678로 저장한 후 다시 읽었을 때 0x12345678이 나오지 않으면
		// 해당 어드레스를 사용하는데 문제가 생긴 것이므로 더이상 진행하지 않고 종료
		if (*pdwCurrentAddress != 0x12345678)
		{
			return FALSE;
		}

		// 1MB씩 이동하면서 확인
		pdwCurrentAddress += (0x100000 / 4);
	}

	return TRUE;
}

// IA-32e 모드 커널을 0x200000(2MByte) 어드레스에 복사
void kCopyKernel64ImageTo2MByte(void)
{
	WORD wKernel32SectorCount, wTotalKernelSectorCount;
	DWORD* pdwSourceAddress, * pdwDestinationAddress;
	int i;

	// 0x7C05에 총 커널 섹터 수, 0x7C07에 보호 모드 커널 섹터 수가 들어 있음
	wTotalKernelSectorCount = *((WORD*)0x7C05);
	wKernel32SectorCount = *((WORD*)0x7C07);

	pdwSourceAddress = (DWORD*)(0x10000 + (wKernel32SectorCount * 512));
	pdwDestinationAddress = (DWORD*)0x200000;
	// IA-32e 모드 커널 섹터 크기만큼 복사
	for (i = 0; i < 512 * (wTotalKernelSectorCount - wKernel32SectorCount) / 4; i++)
	{
		*pdwDestinationAddress = *pdwSourceAddress;
		pdwDestinationAddress++;
		pdwSourceAddress++;
	}
}
```

이제 전체를 빌드하고 실행해보자!

![success ia-32e mode](/contents/dev/2020/05/07/image/os-study-27-1.png)
