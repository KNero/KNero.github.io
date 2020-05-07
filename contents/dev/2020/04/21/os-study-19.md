# 4단계 페이징

2MB 페이지를 사용하는 4단계 페이징 기법은 4KB 페이지를 사용하는 5단계 페이징 기업과 어드레스 변환과정과 크게 다르지 않다.
차이점은 페이지 테이블이 사라지고 페이지 디렉터리가 직접 해당 페이지의 시작 어드레스를 가리킨다는 점이다.

![4 depth paging](/contents/dev/2020/04/21/image/os-study-19-1.png)

선형 주소를 실제 물리 주소로 변환하려면 CR3 레지스터에 설정된 PML4 테이블의 기준 주소로부터 

1. PML4 엔트리(1(테이블 시작 주소) + 2(위치))
2. 페이지 디렉터리 포인터 엔트리(3(테이블 시작 주소) + 4(위치))
3. 디렉터리 엔트리(5(테이블 시작 주소) + 6(위치))

의 순으로 진행하여 2MB 페이지 기준 주소를 찾은 다음 기준 주소에 선형 주소의 하위 21비트 오프셋을 더하면 구할 수 있다.

4단계 페이징 기법을 사용하려면 페이지 맵 레벨 4 테이블(PML4 Table), 페이지 디렉터리 포인터 테이블, 페이지 디렉터리 등 세 가지 자료구조를 생성해야 한다.
(페이지 테이블을 구성하는 엔트리의 구조는 책을 보기 바란다.)

**MINT64 OS를 실행하는 데 필요한 페이지의 역할**

- 선형 주소와 물리 주소를 1:1로 매핑하여 직관적인 어드레스 변환을 수행해야 함
- 2MB 페이지를 사용하여 최대 64GB의 물리 메모리를 매핑해야 함
- 물리 메모리 전체 영역에 대해 캐시를 활성화하여 수행 속도 향상시켜야 함
- 위에서 언급한 기능 외에 다른 기능은 사용하지 않음

**64GB 메모리를 관리하려면 필요한 테이블 개수**

- 페이지 디렉터리는 8바이트 크기인 엔트리 512(2^9)개로 구성
- 각 엔트리는 2MB 페이지에 대한 정보를 담고 있으므로 페이지 디렉터리 하나로 관리할 수 있는 메모리 영역은 (2MB X 512개)가 되어 1GB
- 페이지 디렉터리 하나가 차지하는 메모리 크기는 (8바이트 X 512개)가 되어 4KB
- 최대 64GB 영역을 매핑해야 하므로 필요한 페이지 디렉터리의 수는 64개이고 총 256KB(4KB X 64개)의 메모리 필요

**64GB 메모리를 관리하려면 필요한 페이지 디렉터리 포인터 테이블의 개수**

- 페이지 디렉터리와 마찬가지로 8바이트 크기인 엔트리 512(2^9)개로 구성
- 페이지 디렉터리 포인터의 각 엔트리는 하위 레벨인 페이지 디렉터리에 대한 정보를 포함하며, 앞서 계산했던 페이지 디렉터리 64개를 관리하려면 엔트리가 총 64개 필요
- 페이지 디렉터리 포인터 테이블 한 개로 관리할 수 있는 페이지 디렉터리의 수는 512개 이므로 1개의 페이지 디렉터리 포인터 테이블로 충분
- 4KB(4KB X 1개)의 메모리 필요

**64GB 메모리를 관리하려면 필요한 PML4 테이블 개수**

- 다른 테이블과 마찬가지로 8바이트 크기인 PML4 테이블 엔트리 512(2^9)개로 구성
- 각 엔트리는 하위 레벨인 페이지 디렉터리 포인터 테이블의 정보를 담고 있으며, 페이지 디렉터리 포인터 테이블 1개를 관리하려면 엔트리 1개만 있으면 충분
- 4KB(4KB X 1개)의 메모리 필요

64GB 물리 메모리를 매핑하는데 필요한 페이지 테이블의 개수가 총 66개이며, 총 264KB가 필요하다는 것을 알았다.

[IA-32e 모드 커널 메모리 초기화](https://knero.github.io/#/contents?path=/contents/dev/2020/04/17/os-study-16.md&date=2020.04.17&page=1)에서 본 것과 같이 
1MB부터 2MB까지는 IA-32e 모드용 자료구조 영역으로 사용하고 2MB부터 커널용 이미지가 저장되게 된다. 
자료구조 영역에 방금 공부한 페이지 테이블들이 자리잡을 것이고 페이지 테이블의 순서는 PML4 테이블부터 페이지 디렉터리 포인터 테이블, 페이지 디렉터리의 순서이며 
0x100000(1MB) ~ 0x142000(1MB + 264KB)에 위치한다.

### 각 테이블의 공통적인 속성 필드 설정

- PCD, PWT : 캐시 정책을 사용하기 위해서 사용하며 Write-Through, Write-Back 방식 중 Write-Back 방식을 사용할 것이고 PCD, PWT를 0으로 설정할 것이다.
- U/S, R/W : 유저 레벨과 커널 레벨을 구분하기 위해서 사용할 것이며 아직은 유저 레벨 애플리케이션이 없기 때문에 모든 페이지를 커널 레벨 영역으로 지정하여 읽기, 쓰기가 가능하도록 할것이다. U/S=0, R/W=1로 설정
- EXB : 해당 페이지 내에서 코드 실행을 막는 기능은 사용하지 않으므로 0
- A : 코드 실행 도중에 특정 페이지에 접근(읽기 또는 쓰기)했는지 여부도 참조하지 않으므로 0
- Avail : 사용하지 않으므로 0
- P : 해당 엔트리가 유효하다는 것을 나타내는 필드이므로 1

### 페이지 디렉터리 엔트리용 속성 필드 설정

- PAT : 페이지 별로 특수한 옵션을 지정하는 필드는 사용하지 않으므로 0
- G : 태스크 별로 페이지 매핑을 따로 구성하지 않으므로 페이지 테이블이 고정되어 있으니, 페이지 테이블 교체와 관련된 G 필드는 0
- D : A 와 같이 참조하지 않으므로 0