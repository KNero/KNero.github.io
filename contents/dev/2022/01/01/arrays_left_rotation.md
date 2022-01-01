HackerRank 의 Interview Prepaaration Kit 에 있는 Arrays 문제 중 Arrays: Left Rotation 문제.

`Practice > Interview Preparation Kit > Arrays > Arrays: Left Rotation (Easy)`

## 문제설명

배열을 왼쪽으로 이동 시키고 맨 왼쪽의 숫자는 다시 오른쪽 끝으로 이동시키는 로테이션 문제이다.
예를 들어 [1, 2, 3, 4, 5] 를 왼쪽으로 2 로테이션 시키게 되면 [3, 4, 5, 1, 2] 가 된다.
가장 낮은 인덱스의 아이템이 가장 높은 인덱스로 회전하는 것으로 이런 배열을 순환배열이라 한다.

파라미터로 전달되는 a는 배열이며 b는 로테이션 회수이다. 그리고 로테이션 된 배열을 반환하면 된다.

### 제약조건

* 1 <= n <= 10^5
* 1 <= d <= n
* 1 <= a[i] <= 10^6

### Example

5개의 숫자배열이고 4번 로테이션키셔야 한다.
배열은 [1, 2, 3, 4, 5]
```text
5 4
1 2 3 4 5
```

결과
```text
5 1 2 3 4
```

설명
```text
1 2 3 4 5 -> 2 3 4 5 1 -> 3 4 5 1 2 -> 4 5 1 2 3 -> 5 1 2 3 4
```

## 나의 풀이

```java
public static List<Integer> rotLeft(List<Integer> a, int d) {
    Integer[] result = new Integer[a.size()];
    
    for (int i = 0; i < a.size(); ++i) {
        int n = a.get(i);
        int nextIndex = i - d;
        
        if (nextIndex < 0) {
            nextIndex += a.size();
        }
        
        result[nextIndex] = n;
    }
    
    return Arrays.asList(result);
}
```
