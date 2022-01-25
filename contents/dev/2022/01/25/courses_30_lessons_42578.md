## 위장

## 문제

스파이가 입을 수 있는 옷이 종류별로 주어진다.

```text
종류  이름
얼굴  동그란 안경, 검정 선글라스
상의  파란색 티셔츠
하의  청바지
겉옷  긴 코트
```

하루에 최소 하나의 의상을 입어야 하고 매일 다른 옷을 조합하여 입어야 한다.
서로 다른 옷의 조합 수를 return 하자.

## 예제

```text
clothes                                                                                     return
[["yellowhat", "headgear"], ["bluesunglasses", "eyewear"], ["green_turban", "headgear"]]    5
[["crowmask", "face"], ["bluesunglasses", "face"], ["smoky_makeup", "face"]]                3
```

### 풀이

우선 종류별로 몇 가지의 의상이 있는지 저장한 후 경우의 수를 구하기 위해서 모든 가지 수를 곱해준다.
여기서 입지 않은 경우가 있기 때문에 `+1`을 해주고
마지막에 모두 입지 않은 경우를 제외하기 위해서 `-1`를 해준다.

```java
import java.util.*;

class Solution {
    public int solution(String[][] clothes) {
        HashMap<String, Integer> clothesMap = new HashMap<>();
        
        for (int i = 0; i < clothes.length; ++i) {
            String type = clothes[i][1];
            
            int count = clothesMap.getOrDefault(type, 0);
            clothesMap.put(type, count + 1);
        }
        
        int result = 1;
        
        for (Map.Entry<String, Integer> ent : clothesMap.entrySet()) {
            result *= ent.getValue() + 1; // 입지 않은 경우 추가
        }
        
        return result - 1; // 모두 입지 않은 경우 제외
    }
}
```