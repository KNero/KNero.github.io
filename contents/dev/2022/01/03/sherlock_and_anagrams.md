HackerRank 의 Interview Prepaaration Kit 에 있는 Dictionaries and Hashmaps 문제 중 Sherlock and Anagrams 문제.

`Practice > Interview Preparation Kit > Dictionaries and Hashmaps > Sherlock and Anagrams`

## 문제설명

한 문자열의 문자를 재배열하여 다른 문자열을 구성할 수 있는 경우 두 문자열은 서로의 아나그램이다.
문자열이 주어졌을 때 서로 아나그램인 문자열의 부분 문자열 쌍의 수를 찾아라.

### Example

s = mom

[m, m], [mo, om] 가 나오고 인덱스는 [[0], [2]], [[0, 1], [1, 2]] 이다.
그러므로 총 2개가 나온다. 대칭이 아니고 순서는 상관없다.

s = abba
[a, a], [b, b], [ab, ba], [abb, bba] 로 4개가 나온다.

## 나의 풀이
길이를 변경해 가면서 모든 문자열을 찾는다. 찾는 과정에서 순서와 상관이 없으므로 HashMap 에 문자열의 문자별 개수를 저장하고
각 문자별로 개수가 같은지 검사하여 아나그램 여부를 확인한다.

```java
public static int sherlockAndAnagrams(String s) {
    int result = 0;
    
    for (int len = 1; len < s.length(); ++len) {
        
        for (int i = 0; i < s.length(); ++i) {
            if (i + len <= s.length()) {
                String sub1 = s.substring(i, i + len);
                
                for (int j = i + 1; j < s.length(); ++j) {
                    if (j + len <= s.length()) {
                        String sub2 = s.substring(j, j + len);
                        
                        Map<Character, Integer> m1 = createSMap(sub1);
                        Map<Character, Integer> m2 = createSMap(sub2);
                        
                        boolean isSame = true;
                        for (Map.Entry<Character, Integer> ent : m1.entrySet()) {
                            if (ent.getValue() != m2.get(ent.getKey())) {
                                isSame = false;
                            }
                        }
                        
                        if (isSame) {
                            ++result;
                        }
                    } else {
                        break;
                    }
                }
            } else {
                break;
            }
        }
    }
    
    return result;
}
    
private static Map<Character, Integer> createSMap(String s) {
    HashMap<Character, Integer> m = new HashMap<>();
    
    for (int i = 0; i < s.length(); ++i) {
        char c = s.charAt(i);
        int n = m.getOrDefault(s.charAt(i), 0);
        m.put(c, n + 1);
    }
    
    return m;
}
```