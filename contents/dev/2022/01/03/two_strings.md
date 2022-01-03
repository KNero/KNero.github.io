HackerRank 의 Interview Prepaaration Kit 에 있는 Dictionaries and Hashmaps 문제 중 Two Strings 문제.

`Practice > Interview Preparation Kit > Dictionaries and Hashmaps > Two Strings`

## 문제설명

두 개의 문자열이 주어지면 공통 부분 문자열을 공유하는지 확인하는데 부분 문자열은 한 문자일 수 있다.
만약 공유하는 문자열이 있다면 YES를 반환하고 없다면 NO를 반환한다.

### Example

```text
s1 = 'and'
s2 = 'art'
```
**a** 문자를 공유하므로 YES를 반환

```text
s1 = 'be'
s2 = 'cat'
```
공유하는 문자열이 없으므로 NO를 반환

## 나의 풀이

한 글자라도 겹치게 되면 그보다 긴 문자열도 겹치는 것과 같으므로 한 글자만 검사한다.

```java
public static String twoStrings(String s1, String s2) {
    Set<Character> s1Set = new HashSet<>();
    for (int i = 0; i < s1.length(); ++i) {
        s1Set.add(s1.charAt(i));
    }
    
    for (int i = 0; i < s2.length(); ++i) {
        if (s1Set.contains(s2.charAt(i))) {
            return "YES";
        }
    }
    
    return "NO";
}
```