## 베스트앨범

### 문제

스트리밍 사이트에서 장르 별로 가장 많이 재생된 노래를 두 개씩 모아 베스트 앨범을 출시하려 합니다. 
노래는 고유 번호로 구분하며, 노래를 수록하는 기준은 다음과 같습니다.

```text
속한 노래가 많이 재생된 장르를 먼저 수록합니다.
장르 내에서 많이 재생된 노래를 먼저 수록합니다.
장르 내에서 재생 횟수가 같은 노래 중에서는 고유 번호가 낮은 노래를 먼저 수록합니다.
```

노래의 장르를 나타내는 문자열 배열 genres와 노래별 재생 횟수를 나타내는 정수 배열 plays가 주어질 때, 베스트 앨범에 들어갈 노래의 고유 번호를 순서대로 return 하도록 solution 함수를 완성하세요.

### 제한사항

- genres[i]는 고유번호가 i인 노래의 장르입니다.
- plays[i]는 고유번호가 i인 노래가 재생된 횟수입니다.
- genres와 plays의 길이는 같으며, 이는 1 이상 10,000 이하입니다.
- 장르 종류는 100개 미만입니다.
- 장르에 속한 곡이 하나라면, 하나의 곡만 선택합니다.
- 모든 장르는 재생된 횟수가 다릅니다.

### 예제

```text
genres                                           plays                       return
["classic", "pop", "classic", "classic", "pop"]  [500, 600, 150, 800, 2500]  [4, 1, 3, 0]
```

### 풀이

```java
import java.util.*;

class Solution {
    public Integer[] solution(String[] genres, int[] plays) {
        //      genres, total count
        HashMap<String, Integer> genresCount = new HashMap<>();
        
        for (int i = 0; i < genres.length; ++i) {
            int count = genresCount.getOrDefault(genres[i], 0) + plays[i];
            genresCount.put(genres[i], count);
        }
        
        // total count, genres 로 저장하면서 정렬 (오른차순)
        TreeMap<Integer, String> playMap = new TreeMap<>(Collections.reverseOrder());
        for (Map.Entry<String, Integer> e : genresCount.entrySet()) {
            playMap.put(e.getValue(), e.getKey());
        }
        
        List<String> highGenres = new ArrayList<>(playMap.values()); // 높은 재생수로 정렬된 장르
        Integer[] answer = new Integer[playMap.size() * 2];
        
        for (int i = 0; i < genres.length; ++i) {
            int gi = highGenres.indexOf(genres[i]) * 2;
            
            if (answer[gi] == null || plays[answer[gi]] < plays[i]) {
                if (answer[gi] != null) {
                    answer[gi + 1] = answer[gi];
                }
                answer[gi] = i;
            } else if (answer[gi + 1] == null || plays[answer[gi + 1]] < plays[i]) {
                answer[gi + 1] = i;
            }
        }
        
        ArrayList<Integer> result = new ArrayList<>();
        for (Integer a : answer) {
            if (a != null) {
                result.add(a);
            }
        }
        
        return result.toArray(new Integer[result.size()]);
    }
}

```