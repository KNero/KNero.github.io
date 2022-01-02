HackerRank 의 Interview Prepaaration Kit 에 있는 Arrays 문제 중 New Year Chaos 문제.

`Practice > Interview Preparation Kit > Arrays > New Year Chaos (Medium)`

## 문제설명

새해 첫날에 사람들은 이상한 나라의 롤러코스터를 타기 위해 줄을 서 있다. 사람들은 1~n 까지의 대기열의 초기 위치를 나타내는 스티커를 입고있다. `누구나 바로 앞 사람에게` 뇌물을 주고 자리를 변경할 수 있는데 한 사람당 최대 2명까지만 자리를 변경할 수 있다. 

주어진 대기열 순서에 도달하기 위해 발생한 최소 변경 수를 출력한다. 누군가가 2번이상 자리를 변경할 경우 Too chaotic을 출력한다.

### 제약조건

* 1 <= t <= 10
* 1 <= n <= 10^5

### Example

q = [1, 2, 3, 5, 4, 6, 7, 8]

이 경우 5번이 한 번 변경한 것이기 때문에 1을 출력한다.

q = [4, 1, 2, 3]

이 경우 4번이 3번 자리를 변경했기 때문에 `Too chaotic` 를 출력한다.

## 나의 풀이

앞으로만 이동할 수 있다는 사실이 중요하다. 앞으로만 이동할 수 있기 때문에 뒤에서 부터 초기 인덱스에 있지 않은 사람을 뒤로 이동시켜 준다.
그리고 이동하며 지나간 자리는 위치가 변경됐기 때문에 다시 검사를 해야하므로 `i = j;`를 통해서 i의 위치를 마지막 j로 세팅해준다.

```java
public static void minimumBribes(List<Integer> q) {
    int result = 0;
    Integer[] qa = q.toArray(new Integer[q.size()]);
    
    for (int i = qa.length - 1; i >= 0; --i) {
        
        int change = 0;
        
        for (int j = i; j < qa.length; ++j) {
            if (qa[j] > j + 1) {
                int temp = qa[j];
                qa[j] = qa[j + 1];
                qa[j + 1] = temp;
                ++change;
            } else {
                i = j;
                break;
            }
            
            if (change > 2) {
                System.out.println("Too chaotic");
                return;
            }
        }
        
        result += change;
    }
    
    System.out.println(result);
}
```
