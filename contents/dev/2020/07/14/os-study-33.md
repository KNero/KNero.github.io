# GDT 테이블에 TSS 세그먼트를 추가하자

지금까지 사용한 코드, 데이터 세그먼트 디스크립터는 보호 모드 커널 엔트리 포인트 영역에서 어셈블리어로 작성한 것이다.
이 영역에 `TSS 세그먼트`와 `TSS 세그먼트 디스크립터`를 추가해도 되지만, 커널 엔트리 포인트 영역(512바이트)에 비해 **104바이트의 TSS 세그먼트 디스크립터**가 너무 크다.
그리고 멀티코어를 활성화하게 되면 코어 별로 TSS 세그먼트가 필요하므로 미리 대비하여 1MB 이상의 공간에 GDT 테이블을 생성하는 것이다.

**세그먼트 디스크립터, GDT 테이블, TSS 세그먼트를 위한 자료구조와 매크로**

```
// 조합에 사용할 기본 매크로
#define GDT_TYPE_CODE           0x0A
#define GDT_TYPE_DATA           0x02
#define GDT_TYPE_TSS            0x09
#define GDT_FLAGS_LOWER_S       0x10
#define GDT_FLAGS_LOWER_DPL0    0x00
#define GDT_FLAGS_LOWER_DPL1    0x20
#define GDT_FLAGS_LOWER_DPL2    0x40
#define GDT_FLAGS_LOWER_DPL3    0x60
#define GDT_FLAGS_LOWER_P       0x80
#define GDT_FLAGS_UPPER_L       0x20
#define GDT_FLAGS_UPPER_DB      0x40
#define GDT_FLAGS_UPPER_G       0x80

// 실제로 사용할 매크로
// Lower Flags 는 Code/Data/Tss, DPL0, Present로 설정
#define GDT_FLAGS_LOWER_KERNELCODE ( GDT_TYPE_CODE | GDT_FLAGS_LOWER_S | \
        GDT_FLAGS_LOWER_DPL0 | GDT_FLAGS_LOWER_P )
#define GDT_FLAGS_LOWER_KERNELDATA ( GDT_TYPE_DATA | GDT_FLAGS_LOWER_S | \
        GDT_FLAGS_LOWER_DPL0 | GDT_FLAGS_LOWER_P)
#define GDT_FLAGS_LOWER_TSS ( GDT_FLAGS_LOWER_DPL0 | GDT_FLAGS_LOWER_P )

#define GDT_FLAGS_LOWER_USERCODE ( GDT_TYPE_CODE | GDT_FLAGS_LOWER_S | \
        GDT_FLAGS_LOWER_DPL3 | GDT_FLAGS_LOWER_P)
#define GDT_FLAGS_LOWER_USERDATA ( GDT_TYPE_DATA | GDT_FLAGS_LOWER_S | \
        GDT_FLAGS_LOWER_DPL3 | GDT_FLAGS_LOWER_P)

// Upper Flags는 Graulaty로 설정하고 코드 및 데이터는 64비트 추가
#define GDT_FLAGS_UPPER_CODE ( GDT_FLAGS_UPPER_G | GDT_FLAGS_UPPER_L )
#define GDT_FLAGS_UPPER_DATA ( GDT_FLAGS_UPPER_G | GDT_FLAGS_UPPER_L )
#define GDT_FLAGS_UPPER_TSS ( GDT_FLAGS_UPPER_G )

// 1바이트로 정렬
#pragma pack( push, 1 )

// GDTR 및 IDTR 구조체
typedef struct kGDTRStruct // IA-32e 모드를 위해 기준 주소 필드를 64비트로 정의한 자료구조
{
	WORD wLimit;
	QWORD qwBaseAddress;
	// 16바이트 어드레스 정렬을 위해 추가
	WORD wPading;
	DWORD dwPading;
} GDTR, IDTR;

// 8바이트 크기의 GDT 엔트리 구조
typedef struct kGDTEntry8Struct // 8바이트 크기의 코드와 데이터 세그먼트 디스크립터를 위한 자료구조
{
	WORD wLowerLimit;
	WORD wLowerBaseAddress;
	BYTE bUpperBaseAddress1;
	// 4비트 Type, 1비트 S, 2비트 DPL, 1비트 P
	BYTE bTypeAndLowerFlag;
	// 4비트 Segment Limit, 1비트 AVL, L, D/B, G
	BYTE bUpperLimitAndUpperFlag;
	BYTE bUpperBaseAddress2;
} GDTENTRY8;

// 16바이트 크기의 GDT 엔트리 구조
typedef struct kGDTEntry16Struct // 16바이트 크기의 코드와 데이터 세그먼트 디스크립터를 위한 자료구조
{
	WORD wLowerLimit;
	WORD wLowerBaseAddress;
	BYTE bMiddleBaseAddress1;
	// 4비트 Type, 1비트 0, 2비트 DPL, 1비트 P
	BYTE bTypeAndLowerFlag;
	// 4비트 Segment Limit, 1비트 AVL, 0, 0, G
	BYTE bUpperLimitAndUpperFlag;
	BYTE bMiddleBaseAddress2;
	DWORD dwUpperBaseAddress;
	DWORD dwReserved;
} GDTENTRY16;

// TSS Data 구조체
typedef struct kTSSDataStruct
{
	DWORD dwReserved1;
	QWORD qwRsp[3];
	QWORD qwReserved2;
	QWORD qwIST[7];
	QWORD qwReserved3;
	WORD wReserved;
	WORD wIOMapBaseAddress;
} TSSSEGMENT; // 104 바이트 크기의 TSS 세그먼트를 위한 자료구조

#pragma pack ( pop )
```

자료구조와 매크로를 정의했으니, 이제 디스크립터를 생성하는 함수를 작성해 보자.
디스크립터를 생성하는 함수는 파라미터로 넘어온 각 필드의 값을 세그먼트 디스크립터의 구조에 맞추어 삽입해주는 역할을 한다.

**세그먼트 디스크립터를 생성하는 함수 코드와 사용예**
```
// GDT 테이블을 초기화
void kInitializeGDTTableAndTSS(void)
{
	GDTR* pstGDTR;
	GDTENTRY8* pstEntry;
	TSSSEGMENT* pstTSS;
	int i;

	// GDTR 설정
	// 1MB 에드레스에서 264KB를 페이지 테이블 영역으로 사용하고 있으므로 그 이후 영역을 GDTR, GDT테이블, TSS 세그먼트 영역으로 사용
	pstGDTR = (GDTR*) 0x142000; 
	pstEntry = (GDTENTRY8*) (0x142000 + sizeof(GDTR));
	pstGDTR->wLimit = (sizeof(GDTENTRY8) * 3) + (sizeof(GDTENTRY16) * 1) - 1; 
	// * 3은 NULL, 커널코드, 커널 데이터 디스크립터
	// * 1은 태스크 세그먼트 디스크립터
	pstGDTR-> qwBaseAddress = (QWORD) pstEntry;
	// TSS 영역 설정
	pstTSS = (TSSSEGMENT*) ((QWORD)pstEntry + GDT_TABLESIZE);

	// NULL, 64비트 Code/Data, TSS를 위해 총 4개의 세그먼트를 생성한다.
	kSetGDTEntry8(&(pstEntry[0]), 0, 0, 0, 0, 0);
	kSetGDTEntry8(&(pstEntry[1]), 0, 0xFFFFF, GDT_FLAGS_UPPER_CODE, GDT_FLAGS_LOWER_KERNELCODE, GDT_TYPE_CODE);
	kSetGDTEntry8(&(pstEntry[2]), 0, 0xFFFFF, GDT_FLAGS_UPPER_DATA, GDT_FLAGS_LOWER_KERNELDATA, GDT_TYPE_DATA);
	kSetGDTEntry16((GDTENTRY16*) &(pstEntry[3]), (QWORD) pstTSS, sizeof(TSSSEGMENT) - 1, GDT_FLAGS_UPPER_TSS, GDT_FLAGS_LOWER_TSS, GDT_TYPE_TSS);
	// TSS 세그먼트 영역은 GDT 디스크립터 테이블 다음에 위치하므로, 
	// GDTR 자료구조의 시작 어드레스인 0x142000에서 8바이트의 GDT 엔트리 3개와 16바이트 GDT 엔트리 1개를 더한 어드레스를 사용

	// TSS 초기화 GDT 이하 영역을 사용함
	kInitializeTSSSegment(pstTSS);
}

// 8바이트 크기의 GDT 엔트리에 값을 설정
// 코드와 데이터 세그먼트 디스크립터
void kSetGDTEntry8(GDTENTRY8* pstEntry, DWORD dwBaseAddress, DWORD dwLimit, BYTE bUpperFlags, BYTE bLowerFlags, BYTE bType)
{
	pstEntry->wLowerLimit = dwLimit & 0xFFFF;
	pstEntry->wLowerBaseAddress = dwBaseAddress & 0xFFFF;
	pstEntry->bUpperBaseAddress1 = (dwBaseAddress >> 16) & 0xFF;
	pstEntry->bTypeAndLowerFlag = bLowerFlags | bType;
	pstEntry->bUpperLimitAndUpperFlag = ((dwLimit >> 16) & 0xFF) | bUpperFlags;
	pstEntry->bUpperBaseAddress2 = (dwBaseAddress >> 24) & 0xFF;
}

// 16바이트 크기의 GDT 엔트리에 값을 설정
// TSS 세그먼트 디스크립터
void kSetGDTEntry16(GDTENTRY16* pstEntry, QWORD qwBaseAddress, DWORD dwLimit, BYTE bUpperFlags, BYTE bLowerFlags, BYTE bType)
{
	pstEntry->wLowerLimit = dwLimit & 0xFFFF;
	pstEntry->wLowerBaseAddress = qwBaseAddress & 0xFFFF;
	pstEntry->bMiddleBaseAddress1 = (qwBaseAddress >> 16) & 0xFF;
	pstEntry->bTypeAndLowerFlag = bLowerFlags | bType;
	pstEntry->bUpperLimitAndUpperFlag = ((dwLimit >> 16) & 0xFF) | bUpperFlags;
	pstEntry->bMiddleBaseAddress2 = (qwBaseAddress >> 24) & 0xFF;
	pstEntry->dwUpperBaseAddress = qwBaseAddress >> 32;
	pstEntry->dwReserved = 0;
}
```

**위 코드에서 GDTR 자료구조의 시작 어드레스를 0x142000으로 설정하고, 그 이후 어드레스부터 각 자료구조를 위치시킨 이유는 0x100000(1MB) 영역부터 264KB를
페이지 테이블로 사용하기 때문이다. 그래서 그 이후부터 GDT와 TSS 세그먼트를 생성하여 IA-32e 모드에서 사용하게 했다.**

다음은 I/O맵을 사용하지 않고 7 ~ 8MB 영역을 IST 1로 사용하도록 TSS 세그먼트를 초기화하는 코드이다.

```
void kInitializeTSSSegment(TSSSEGMENT* pstTSS)
{
	kMemSet(pstTSS, 0, sizeof(TSSDATA));
	pstTSS->qwIST[0] = 0x800000;
	pstTSS->wIOMapBaseAddress = 0xFFFF;
}
```

### GDT 테이블 교체와 TSS 세그먼트 로드

이제 GDT 테이블과 TSS 세그먼트 생성을 완료했으니 GDT 테이블을 교체하고 TSS 세그먼트를 프로세서에 로드할 차례이다.
GDT 테이블을 교체하는 방법은 6장에서 살펴본 것과 같이 LGDT 명령을 사용하여 GDT 정보를 수정하면 된다.
세그먼트 디스크립터의 오프셋은 기존 테이블과 같으므로 변경할 필요가 없다.

GDT는 LGDT 명령으로 갱신할 수 있고 TSS 세그먼트를 로드하는 방법은 x86 프로세서의 태스크 관련 정보를 저장하는 Task Register(TR)를 사용한다.
TR 레지스터는 현재 프로세서가 수행 중인 태스크의 정보를 관리하며, GDT 테이블 내에 TSS 세그먼트 디스크립터의 오프셋이 저장되어 있다.
따라서 LTR 명령어를 사용하여 GDT 테이블 내의 TSS 세그먼트 인덱스인 0x18을 지정함으로써 TSS 세그먼트를 프로세서에 설정할 수 있다.

**LGDT와 LTR 명령어를 수행하는 어셈블리어 함수와 C 함수 선언 코드**

```
; GDTR 레지스터에 GDT 테이블을 설정
; PARAM: GDT 테이블의 정보를 저장하는 자료구조의 어드레스
kLoadGDTR:
	lgdt[rdi]	; 파라미터 1(GDTR의 어드레스)를 프로세서에 로드하여 GDT 테이블을 설정
	ret

; TR 레지스터에 TSS 세그먼트 디스크립터 설정
; PARAM: TSS 세그먼트 디스크립터의 오프셋
kLoadTR:
	ltr di 		; 파라미터 1(TSS 세그먼트 디스크립터의 오프셋)을 프로세서에 설정하여 TSS 세그먼트를 로드
	ret
```

```
// C 함수 선언
void kLoadGDTR(QWORD qwGDTRAddress);
void kLoadTR(WORD sTSSSegmentOffset);
```

**GDT 테이블을 갱신하고 TSS 세그먼트를 프로세서에 로드하는 코드**

```
void Main(void)
{
	...

	kInitializeGDTTableAndTSS();
	kLoadGDTR(0x142000); // GDT 테이블의 정보를 나타내는 자료구조(GDTR)의 어드레스
	kLoadTR(0x18); // GDT 테이블에서 TSS 세그먼트 오프셋

	...
}
```