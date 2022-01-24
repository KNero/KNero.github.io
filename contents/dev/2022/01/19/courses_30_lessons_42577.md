## 전화번호 목록

## 문제

주어진 문자열중 어떤 문자열이 다른 문자열의 접두어(앞 부분이 같은지)인 경우가 있는지 찾는다.

```text
구조대 : 119
박준영 : 97 674 223
지영석 : 11 9552 4421
```

구조대 전화번호는 영석이의 전화번호의 접두사이다.
어떤 문자열이 다른 문자열의 접두어인 경우가 있으면 false.
그렇지 않으면 true를 return.


## 예제

```text
phone_book                         return
["119", "97674223", "1195524421"]  false
["123","456","789"]                true
["12","123","1235","567","88"]     false
```

### 풀이

해시를 사용한 문제라고는 했지만 정렬이 더 편할 것 같아서 정렬을 사용하여 풀었다.
문자열을 정렬하게 되면 앞부분 부터 같은 문자열이 나열되기 때문에 이전 문자열이 다음 문자열의 접두어인지 확인하면 된다.

```
["119", "97674223", "1195524421"] -> ["119", "1195524421", "97674223"]
```

```java
import java.util.*;

class Solution {
    public boolean solution(String[] phone_book) {
        Arrays.sort(phone_book);
        
        for (int i = 0; i < phone_book.length - 1; ++i) {
            if (phone_book[i + 1].startsWith(phone_book[i])) {
                return false;
            }
        }
        
        return true;
    }
}
```