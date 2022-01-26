## 완주하지 못한 선수

### 문제

마라톤 선수들 중 단 한명의 선수만 제외하고 모두 완주했다. 

마라톤에 참여한 선수들의 이름이 담긴 배열 participant와 완주한 선수들의 이름이 담긴 배열 completion이 주어질 때, 완주하지 못한 선수의 이름을 return 해라.

### 예제

```
participant                                        completion                                return
["leo", "kiki", "eden"]                            ["eden", "kiki"]                          "leo"
["marina", "josipa", "nikola", "vinko", "filipa"]  ["josipa", "filipa", "marina", "nikola"]  "vinko"
["mislav", "stanko", "mislav", "ana"]              ["stanko", "ana", "mislav"]               "mislav"
```

### 풀이

제한 사항중에 `참가자 중에는 동명이인이 있을 수 있습니다.` 가 있다는 것을 주의해야 한다.
동명이인이 있기 때문에 참가자의 이름을 Map 의 key로 사용하고 value 에 몇 명인지를 저장한다.
그리고 참가자를 저장한 Map 에서 완주한 사람들의 이름을 제외해 가며 남은 한 명을 찾는다.

```java
import java.util.HashMap;

class Solution {
    public String solution(String[] participant, String[] completion) {
        HashMap<String, Integer> countMap = new HashMap<>();
        
        for (String p : participant) {
            int count = countMap.getOrDefault(p, 0);
            countMap.put(p, count + 1);
        }
        
        for (String c : completion) {
            int count = countMap.get(c) - 1;
            if (count == 0) {
                countMap.remove(c);
            } else {
                countMap.put(c, count);
            }
        }
        
        return countMap.keySet().iterator().next();
    }
}
```