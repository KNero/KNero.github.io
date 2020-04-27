# IA-32e 지원 여부 검사

우선 잠깐 IA-32e 모드로 전환하기 위한 순서를 알아보자

1. 세그먼트 디스크립터 추가(IA-32e 모드 코드와 데이터용 세그먼트 디스크립터 추가)
2. CR4 컨트롤 레지스터 설정(CR4 컨트롤 레지스터의 PAE비트=1)
3. CR3 컨트롤 레지스터 설정(CR3 컨트롤 레지스터에 PML4 테이블 어드레스 설정)
4. IA32_EFER 레지스터 설정(IA32_EFER 레지스터(MSR 레지스터)의 LME 비트=1)
5. CR0 컨트롤 레지스터 설정(CR0 컨트롤 레지스터의 PG 비트=1)
6. jmp 명령으로 CS 세그먼트 셀렉터 변경 및 IA-32e 모드로 전환(jmp 0x18:IA-32e 모드 커널의 시작 어드레스)
* 위로는 32비트 보호 모드, 아래로는 64비트 IA-32e 모드
7. 각종 세그먼트 셀럭터와 스택 초기화(DS, ES, FS, GS, SS 세그먼트 셀럭터와 RSP, RBP 레지스터 초기화)
8. IA-32e 모드 커널 실행
(2 ~ 5: 페이징 활성화 및 모드 전환)

그럼 이제 IA-32e 모드를 지원 여부를 확인해야 하는데 `CPUID` 명령어를 이용하여 여부를 확인할 수 있다.
`CPUID` 는 CPU Identification의 약자로 EAX 레지스터에 설정된 값에 따라 해당 정보를 조회하며, 범용 레지스터 EAX, EBX, ECX, DEX 를 통해 그결과를 넘겨준다.
`CPUID` 는 크게 기본정보와 확장 정보를 제공한다.

EAX 값 / 설명
**0x00000000**
- 기본 CPUID 정보 조회
- EAX : 해당 프로세서가 지원하는 기본 CPUID 정보의 입력 최대값(EAX)
- EBX, EDX, ECX의 순서, 하위 바이트에서 상위 바이트의 순서로 12바이트 제조사 이름이 저장됨. 인텔은 'GenuineIntel'로 표시되며, AMD는 'AuthenticAMD'로 표시됨

**0x80000001**
- 확장 기능 CPUID 정보 조회
- EAX : 제조사마다 차이가 있음
- EBX : 제조사마다 차이가 있음
- ECX : 비트 0 - 64비트 모드에서 LAHF/SAHF 명령 지원 여부, 그 외 나머지 비트 - 제조사 마다 차이가 있음
- EDX : 비트 11 - 64비트 모드에서 SYSCALL/SYSRET 명령 지원 여부, 비트 20 - Execute Disable 비트 지원 여부, 비트 29 - 64비트 모드 지원 여부, 그 외 나머지 비트 - 제조사마다 차이가 있음

위에서 알 수 있듯이 `0x80000001`으로 확장 기능 CPUID 정보를 조회하면, `EDX` 레지스터의 비트 29로 64비트 지원 여부를 확인할 수 있다.
`CPUID` 명령어는 EAX 레지스터에서 조회할 정보를 넘겨받고, 조회된 정보를 EAX, EBX, ECX, EDX 레지스터에 담아 넘겨준다.
여기서 우리는 어셈블리어로 `kReadCPUID()` 함수를 작성하고 C코드에서 이를 호출하도록 할 것이다.

**kReadCPUID() 함수의 어셈블리어코드**
```
; C 언어에서 호출할 수 있도록 이름을 노출(Export)
global kReadCPUID

SECTION .text

; CPUID를 반환
; PARMA: DWORD dwEAX, DWORD* pdwEAX, *pdwEBX, *pdwECX, *pdwEDX
kReadCPUID:
    push ebp        ; 베이트 포인터 레지스터(EBP)를 스택에 삽입
    move ebp, esp   ; 베이트 포인터 레지스터(EBP)에 스택 포인터 레지스터(ESP)의 값을 설정
    push eax        ; 함수에서 임시로 사용하는 레지스터로 함수의 마지막 부분에서
    push ebx        ; 스택에 삽입된 값을 꺼내 원래 값으로 복원
    push ecx
    push edx
    push esi

    ; EAX 레지스터의 값으로 CPUID 명령어 실행
    mov eax, dword[ebp + 8] ; 파라미터 1(dwEAX)를 EAX 레지스터에 저장
    cpuid                   ; CPUID 명령어실행

    ; 반횐된 값을 파라미터에 저장
    ; *pdwEAX
    mov esi, dword[ebp + 12] ; 파라미터 2(pdwEAX)를 ESI 레지스터에 저장
    mov dword[esi], eax      ; pdwEAX가 포인터이므로 포인터가 가리키는 어드레스에 EAX 레지스터의 값을 저장
                             ; dwEAX 변수의 어드레스를 넘겨받아 해당 어드레스에 CPUID의 결과로 넘겨받은 EAX 값을 저장.
                             ; 넘겨받은 파라미터가 dwEAX의 어드레스이므로 2단계에 걸쳐서 결과를 저장
    ; *pdwEBX
    mov esi, dword[ebp + 16] ; 파라미터 3(pdwEBX)를 ESI 레지스터에 저장
    mov dword[esi], ebx      ; pdwEBX가 포인터이므로 포인터가 가리키는 어드레스에 EBX 레지스터의 값을 저장

    ; *pdwECX
    mov esi, dword[ebp + 20] ; 파라미터 4(pdwECX)를 ESI 레지스터에 저장
    mov dword[esi], ecx      ; pdwECX가 포인터이므로 포인터가 가리키는 어드레스에 ECX 레지스터의 값을 저장

    ; *pdwEDX
    mov esi, dword[ebp + 24] ; 파라미터 5(pdwEDX)를 ESI 레지스터에 저장
    mov dword[esi], edx      ; pdwEDX가 포인터이므로 포인터가 가리키는 어드레스에 EDX 레지스터의 값을 저장

    pop esi ; 함수에서 사용이 끝난 ESI 레지스터부터 EBP 레지스터까지를 스택에
    pop edx ; 삽입된 값을 이용해서 복원
    pop ecx ; 스택은 가장 마지막에 들어간 데이터가 가장 먼저 나오는
    pop ebx ; 자료구조이므로 삽입의 역순으로
    pop eax ; 제거해야 함
    pop ebp ; 베이스 포인터 레지스터(EBP) 복원
    ret     ; 함수를 호출한 다음 코드의 위치로 복귀
```

**kReadCPUID() 함수의 선언**
```
void kReadCPUID(DWORD dwEAX, DWORD* pdwEAX, DWORD* pdwEBX, DWORD* pdwECX, DWORD* pdwEDX);
```

**kReadCPUID() 함수를 사용하여 제조사 문자열을 조합하는 코드**
```
DWORD dwEAX, dwEBX, dwECX, dwEDX;
char vcVendorString[13] = {0, }; // 제조사 문자열을 담을 문자열 버퍼, kPrintString() 함수를 출력하려고 13바이트를 할당하고 0으로 채움

// 프로세서 제조사 정보 읽기
kReadCPUID(0x00, &dwEAX, &dwEBX, &dwECX, &dwEDX);

// 문자가 저장된 순서가 하위 바이트에서 상위 바이트의 순서이므로 그대로 문자열 버퍼에 복사하면 정상으로 출력 가능.
// 4바이트씩 한 번에 복사하려고 DWORD로 캐스팅함
*(DWORD*) vcVendorString = dwEAX; 
*((DWORD*) vcVendorString + 1) = dwEDX;
*((DWORD*) vcVendorString + 2) = dwECX;

// 제조사 문자열이 출력됨
kPrintString(0, 0, vcVendorString);
```

**kReadCPUID() 함수로 IA-32e 모드 지원 여부를 검사하는 코드**
```
DWORD dwEAX, dwEBX, dwECX, dwEDX;

// 64비트 지원 여부 확인
kReadCPUID(0x80000001, &dwEAX, &dwEBX, &dwECX, &dwEDX);
if (dwEDX & (1 << 29))
{
	kPrintString(0, 0, "Pass");
}
else
{
	kPrintString(0, 0, "Fail");
}
```

이것으로 IA-32e 모드 지원 여부를 확인할 수 있게 되었다. 이제 모드를 전환하는 방법을 알아보자.