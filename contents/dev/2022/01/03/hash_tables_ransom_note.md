HackerRank 의 Interview Prepaaration Kit 에 있는 Dictionaries and Hashmaps 문제 중 Array Manipulation 문제.

`Practice > Interview Preparation Kit > Dictionaries and Hashmaps > Hash Tables: Ransom Note`

## 문제설명

잡지에서 전체 단어를 잘라서 사용하려고 한다. 노트에 있는 단어를 잡지에서 찾으려고 하는데 부분이 아닌 전체 단어이면서 대소문자를 구분해야 한다.
잡지에서 노트에 있는 모든 단어를 찾을 수 있다면 Yes, 만약 찾을 수 없다면 No 를 출력해라.

### Example

magazine = "attack at dawn", note = "Attack at dawn"

단어는 모두 있지만 대소문자가 일치하지 않는 단어가 있으므로 No를 출력.

## 나의 풀이

같은 단어가 여러 개 있을 수 있기 때문에 HashMap에 단어별 카운트를 저장해 준다.

```java
public static void checkMagazine(List<String> magazine, List<String> note) {
    HashMap<String, Integer> mCount = new HashMap<>();
    
    for (String m : magazine) {
        Integer i = mCount.getOrDefault(m, 0);
        mCount.put(m, i + 1);
    }
    
    for (String n : note) {
        if (mCount.containsKey(n)) {
            Integer i = mCount.get(n) - 1;
            
            if (i == 0) {
                mCount.remove(n);
            } else {
                mCount.put(n, i);
            }
        } else {
            System.out.println("No");
            return;
        }
    }
    
    System.out.println("Yes");
}
```