# 페이지 테이블 생성과 페이징 기능 활성화

이제 페이지 테이블을 다루는데 필요한 자료구조와 매크로를 정의하고, 이를 사용해서 페이지 테이블을 생성해 보자.
그리고 CR0, CR3, CR4 컨트롤 레지스터를 제어하여 페이징 기능을 활성해 보자.

세종류의 페이지 엔트리는 내부 필드가 거의 유사하므로 하나의 구조를 공용으로 사용할 것이다.
```
typedef struct pageTableEntryStruct
{
	// 8바이트 크기의 페이지 엔트리 중에 하위 4바이트를 의미.
	// 기준 주소의 하위 필드와 G비트, PAT비트, D비트, A비트,
	// PCD비트, PWT비트, U/S비트, R/W비트, P비트 등을 포함
	DWORD dwAttributeAndLowerBaseAddress;

	// 8바이트 크기의 페이지 엔트리 중에 상위 4바이트를 의미,
	// 기준 주소의 상위 필드와 EXB 비트 등을 포함
	DWORD dwUpperBaseAddressAndEXB;
} PML4TENTRY, PDPTENTRY, PDENTRY, PTENTRY;
```

속성 필드는 8바이트 크기의 자료구조가 4바이트로 나누어졌으므로 이를 고려하여 각 속성에 대한 플래그를 정해했다.

**페이지 엔트리의 속성필드를 정의한 매크로**
```
// 하위 32비트 용 속성 필드
#define PAGE_FLAGS_P   0x00000001 // Present
#define PAGE_FLAGS_RW  0x00000002 // Read/Write
#define PAGE_FLAGS_US  0x00000004 // User/Supervisor(플래그 설정 시 유저 레벨)
#define PAGE_FLAGS_PWT 0x00000008 // Page Level Write-through
#define PAGE_FLAGS_PCD 0x00000010 // Page Level Cache Disable
#define PAGE_FLAGS_A   0x00000020 // Accessed
#define PAGE_FLAGS_D   0x00000040 // Dirty
#define PAGE_FLAGS_PS  0x00000080 // Page Size
#define PAGE_FLAGS_G   0x00000100 // Global
#define PAGE_FLAGS_PAT 0x00001000 // Page Attribute Table Index
// 상위 32비트 용 속성 필드
#define PAGE_FLAGS_EXB 0x80000000 // Execute Disable 비트
// 기타
#define PAGE_FLAGS_DEFAULT (PAGE_FLAGS_P | PAGE_FLAGS_RW) // 실제 속성을 나타내는 필드는 아니지만 편의를 위해 정의함
```

**PLM4 테이블을 생성하는 코드**
```
// 페이지 엔트리에 데이터를 설정하는 함수
// dwUpperBaseAddress, dwLowerBaseAddress: 32비트 변수로 64비트 어드레스를 표현할 수 없으므로 상위 32비트와 하위 32비트 어드레스를 나타내는 변수를 사용
void kSetPageEntryData(PTENTRY* pstEntry, DWORD dwUpperBaseAddress, DWORD dwLowerBaseAddress, DWORD dwLowerFlags, DWORD dwUpperFlags)
{
	pstEntry->dwAttributeAndLowerBaseAddress = dwLowerBaseAddress | dwLowerFlags;
	pstEntry->dwUpperBaseAddressAndEXB = (dwUpperBaseAddress & 0xFF) | dwUpperFlags;
}

// 페이지 테이블을 생성하는 함수
void kInitializePageTables(void)
{
	PML4TENTRY* pstPML4TEntry;
	int i;

	pstPML4TEntry = (PML4TENTRY*) 0x100000;
	kSetPageEntryData(&(pstPML4TEntry[0]), 0x00, 0x101000, PAGE_FLAGS_DEFAULT, 0);

	for (i = 1; i < 512; i++)
	{
		kSetPageEntryData(&(pstPML4TEntry[i]), 0, 0, 0, 0);
	}
}
```

32비트 환경에서 64비트 어드레스를 표현하는 방법데 대해서 짚고 넘어가겠다. `kSetPageEntryData()` 함수에서 64비트 어드레스를 표현하려고 `dwUpperBaseAddress`와 `dwLowerBaseAddress`의 두 개의 변수를 사용한 것을 볼 수 있다. 보호 모드에서 단일 레지스터로는 최대 32비트 값까지만 표현할 수 있기 때문에 64비트 어드레스를 전달을 위해 상위 32비트와 하위32비트로 나눈 후 넘겨주었다.

이는 어드레스를 계한할 때도 동일하게 적용되는데 `dwUpperBaseAddress`의 값은 `dwLowerBaseAddress`의 값이 4GB를 넘을 때마다 증가해야 한다. 그런데 어드레스 계산 도중 32비트 범위를 초과하면 안 되므로 이를 고려하여 계산해야 한다. MINT64 OS는 페이지의 크기가 2MB 이므로, 상위 어드레스를 계산할 때 미리 1MB로 나누어 계산 도중 32비트 값을 넘지 않게 했다. 그리고 계산이 끝난 결과를 다시 4KB로 나누어 최종 결과(상위 32비트 어드레스)를 얻는다.

**64GB까지 매핑하는 페이지 디렉터리를 생성하는 코드**
```
pstPDEntry = (PDENTRY*) 0x102000;
dwMappingAddress = 0;

for (i = 0; i < 512 * 64; i++)
{
	kSetPageEntryData(&(pstPDEntry[i]), (i * (0x200000 >> 20)) >> 12, dwMappingAddress, PAGE_FLAGS_DEFAULT | PAGE_FLAGS_PS, 0);
	dwMappingAddress += PAGE_DEFAULTSIZE;
}
```

## 프로세서의 페이지 기능 활성화

CR0 레지스터의 PG비트와 CR3 레지스터, CR4 레지스터의 PAE 비트만 1로 설정하면 페이징 기능을 사용할 수 있다.
PG 비트는 CR0 레지스터의 최상위 비트에 위치하며 1로 설정하면 즉시 프로세서의 페이징 기능이 활성화되기 때문에 설정하기 전에 CR3 레지스터에 최상위 페이지 테이블인 PML4 테이블의 어드레스를 설정해야 한다.
CR3 레지스터는 페이지 디렉터리 베이스 레지스터(PDBR, Page-Directory Base Register)라고도 불리며, 최상위 페이지 테이블의 어드레스를 프로세서에 알리는 역할을 한다.
그리고 페이지 폴트 예외를 처리하려면  예외가 발생한 선형 주소가 필요하며, CR2 레지스터가 이러한 역할을 담당한다.

![cr3 cr2](/contents/dev/2020/04/22/image/os-study-20-1.png)

IA-32e 모드에서 동작하며 2MB의 크기를 가지는 페이징을 활성화하기 위해서는 CR4 레지스터를 사용해야 한다. 
그리고 CR4 레지스터의 PAE(Physical Address Extensions) 비트와 페이지 디렉터리 엔트리 PS 비트를 1로 설정함으로써 처리할 수 있다.

**PAE**

- Physical Address Extensions의 약자로 36비트 이상의 물리 메모리를 사용할지 여부를 설정
- 1로 설정하면 36비트 이상의 물리 메모리를 사용함으로 나타내며, 0으로 설졍하면 사용하지 않음을 나타냄
- IA-32e 모드에서는 필수적으로 1로 설정해야 함

![cr4](/contents/dev/2020/04/22/image/os-study-20-2.png)

(각 필드의 설명은 책 표 9-2 참고)

```
; PAE 비트를 1로 설정
mov eax, cr4 			; CR4 컨트롤 레지스터의 값을 EAX 레지스터에 저장
or eax, 0x20 			; PAE 비트(비트 5)를 1로 설정
mov cr4, eax 			; 설정된 값을 다시 CR4 컨트롤 레지스터에 저장

; PML4 테이블의 어드레스와 캐시 활성화
mov eax, 0x100000 		; EAX 레지스터에 PML4 테이블이 존재하는 0x100000(1MB)를 저장
						; 캐시 기능을 활성화해야 하므로 PCD 비트, PWT 비트를 모두 0으로 설정해야 하고,
						; PML4 테이블이 0x100000(1MB)의 어드레스에 위치하므로 CR3 레지스터에 0x100000을 대입
mov cr3, eax 			; CR3 컨트롤 레지스터에 0x100000(1MB)을 저장

; 프로세서의 페이징 기능 활성화
mov eax, cr0 			; EAX 레지스터에 CR0 컨트롤 레지스터를 저장
or eax, 0x80000000 		; PG 비트(비트 31)를 1로 설정
mov cr0, eax 			; 설정된 값을 다시 CR0 컨트롤 레지스터에 저장
```

보호 모드에서 IA-32e 모드용으로 생성된 페이지 테이블을 지정하면, 잘못된 엔트리 정보를 참조하므로 
페이징 기능을 활성화하는 코드는 IA-32e 모드용 디스크립터가 생성된 후에 사용할 것이다.
