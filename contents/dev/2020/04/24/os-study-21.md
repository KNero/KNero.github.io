# 보호 모드 커널에 페이지 테이블 생성 기능 추가

지금까지 공부한 내용들을 통합하여 페이지 테이블 생성 기능을 추가해 보겠다.
`01.Kernel32/Source` 디렉터리 밑에 Page.h, Page.c 파일을 추가하고 소스를작성해 준다.

**Page.h**
```
#ifndef __PAGE_H__
#define __PAGE_H__

#include "Types.h"

// 하위 32비트 용 속성 필드
#define PAGE_FLAGS_P       0x00000001 // Present
#define PAGE_FLAGS_RW      0x00000002 // Read/Write
#define PAGE_FLAGS_US      0x00000004 // User/Supervisor(플래그 설정 시 유저 레벨)
#define PAGE_FLAGS_PWT     0x00000008 // Page Level Write-through
#define PAGE_FLAGS_PCD     0x00000010 // Page Level Cache Disable
#define PAGE_FLAGS_A       0x00000020 // Accessed
#define PAGE_FLAGS_D       0x00000040 // Dirty
#define PAGE_FLAGS_PS      0x00000080 // Page Size
#define PAGE_FLAGS_G       0x00000100 // Global
#define PAGE_FLAGS_PAT     0x00001000 // Page Attribute Table Index
// 상위 32비트 용 속성 필드
#define PAGE_FLAGS_EXB     0x80000000 // Execute Disable 비트
// 기타
#define PAGE_FLAGS_DEFAULT (PAGE_FLAGS_P | PAGE_FLAGS_RW) // 실제 속성을 나타내는 필드는 아니지만 편의를 위해 정의함
#define PAGE_TABLESIZE     0x1000
#define PAGE_MAXENTRYCOUNT 512
#define PAGE_DEFAULTSIZE   0x200000

// 구조체
#pragma pack (push, 1)

// 페이지 엔트리에 대한 자료구조
typedef struct kPageTableEntryStruct
{
	// PML4T와 PDPTE의 경우
	// 1비트 P, RW, US, PWT, PCD, A, D, PS, G, 3비트 Avail, 1비트 PAT, 8비트 Reserved, 20비트 Base Address
	// PDE의 경우
	// 1비트 P, RW, US, PWT, PCD, A, D, 1, G, 3비트 Avail, 1비트 PAT, 8비트 Avail, 11비트 Base Address
	DWORD dwAttributeAndLowerBaseAddress;

	// 8비트 Upper BaseAddress, 12비트 Reserved, 11비트 Avail, 1비트 EXB
	DWORD dwUpperBaseAddressAndEXB;
} PML4TENTRY, PDPTENTRY, PDENTRY, PTENTRY;

#pragma pack(pop)

// 함수
void kInitializePageTables(void);
void kSetPageEntryData(PTENTRY* pstEntry, DWORD dwUpperBaseAddressAndEXB, DWORD dwLowerBaseAddress, DWORD dwLowerFlags, DWORD dwUpperFlags);

#endif /*__PAGE_H__*/
```

**Page.c**
```
#include "Page.h"

// IA-32e 모드 커널을 위한 페이지 테이블 생성
void kInitializePageTables(void)
{
	PML4TENTRY* pstPML4TEntry;
	PDPTENTRY* pstPDPTEntry;
	PDENTRY* pstPDEntry;
	DWORD dwMappingAddress;
	int i;

	// PML4 테이블 생성
	// 첫 번째 엔트리 외 나머지는 모두 0으로 초기화
	pstPML4TEntry = (PML4TENTRY*) 0x100000;
	kSetPageEntryData(&(pstPML4TEntry[0]), 0x00, 0x101000, PAGE_FLAGS_DEFAULT, 0);

	for (i = 1; i < PAGE_MAXENTRYCOUNT; i++)
	{
		kSetPageEntryData(&(pstPML4TEntry[i]), 0, 0, 0, 0);
	}

	// 페이지 디렉터리 포인터 테이블 생성
	// 하나의 PDPT로 512GB까지 매핑 가능하므로 하나로 충분함
	// 64개의 엔트리를 설정하여 64GB까지 매핑함
	pstPDPTEntry = (PDPTENTRY*) 0x101000;
	for (i = 0; i < 64; ++i)
	{
		kSetPageEntryData(&(pstPDPTEntry[i]), 0, 0x102000 + (i * PAGE_TABLESIZE), PAGE_FLAGS_DEFAULT, 0);
	}

	for (i = 64; i < PAGE_MAXENTRYCOUNT; ++i)
	{
		kSetPageEntryData(&(pstPDPTEntry[i]), 0, 0, 0, 0);
	}

	// 페이지 디렉터리 테이블 생성
	// 하나의 페이지 디렉터리가 1GB까지 매핑 가능
	// 여유있게 64개의 페이지 디렉터리를 생성하여 총 64GB까지 지원
	pstPDEntry = (PDENTRY*) 0x102000;
	dwMappingAddress = 0;

	for (i = 0; i < PAGE_MAXENTRYCOUNT * 64; i++)
	{
		// 32비트로는 상위 어드레스를 표현할 수 없으므로, MB단위로 계산한 다음
		// 최종 결과를 다시 4KB로 나누어 32비트 이상의 어드레스를 계산함
		kSetPageEntryData(&(pstPDEntry[i]), (i * (0x200000 >> 20)) >> 12, dwMappingAddress, PAGE_FLAGS_DEFAULT | PAGE_FLAGS_PS, 0);
		dwMappingAddress += PAGE_DEFAULTSIZE;
	}

}

// 페이지 엔트리에 데이터를 설정하는 함수
// dwUpperBaseAddress, dwLowerBaseAddress: 32비트 변수로 64비트 어드레스를 표현할 수 없으므로 상위 32비트와 하위 32비트 어드레스를 나타내는 변수를 사용
void kSetPageEntryData(PTENTRY* pstEntry, DWORD dwUpperBaseAddress, DWORD dwLowerBaseAddress, DWORD dwLowerFlags, DWORD dwUpperFlags)
{
	pstEntry->dwAttributeAndLowerBaseAddress = dwLowerBaseAddress | dwLowerFlags;
	pstEntry->dwUpperBaseAddressAndEXB = (dwUpperBaseAddress & 0xFF) | dwUpperFlags;
}
```

두 개의 소스파일을 작성하고 main에 초기화 하는 코드를 넣어주자. `Main.c`에 `include "Page.h"`를 추가해 주고
main 함수 가장 밑에 아래 코드를 작성하면 된다.
실제 소스: [Main.c](https://github.com/KNero/os-study/blob/master/01.Kernel32/Source/Main.c)

```
// IA-32e 모드 커널을 위한 페이지 테이블 생성
kPrintString(0, 6, "IA-32e Page Tables Initialize...............[    ]");
kInitializePageTables();
kPrintString(45, 6, "Pass");
```

빌드 후 실행해 주면 아래와 같이 성공한 화면을 볼 수 있다.

![create page table](/contents/dev/2020/04/24/image/os-study-21-1.png)

이제 IA-32e 모드로 전환하기 위한 모든 준비가 끝났으므로 다음에는 64비트로 들어갈 수 있을 것 같다.