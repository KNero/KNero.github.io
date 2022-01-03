HackerRank 의 Interview Prepaaration Kit 에 있는 Arrays 문제 중 Array Manipulation 문제.

`Practice > Interview Preparation Kit > Arrays > Array Manipulation (Hard)`

## 문제설명

인덱스가 1로 시작하고 모두 0으로 채워져 있는 배열과 무엇을 수행해야 하는 지 알려주는 리스트가 주어진다.

수행해야 해야 하는 것을 알려주는 리스트는 이중리스트로 구성되어 있으며 리스트 안의 각 리스트는 3개의 숫자로 이루어져 있다.

3개의 숫자인 a, b, k 중 a, b는 배열의 인덱스를 나타내며 a에서 b까지 k의 숫자가 채워야 한다는 것을 의미한다. 
그리고 a부터 b 까지 k로 채우지만 만약 이미 다른 숫자가 채워져 있을 경우 더해서 채워준다.

모든 리스트를 수행하고 만들어지는 배열 중 가능 큰 값을 반환하면 된다.

### Example

n = 10
queries = [[1, 5, 3], [4, 8, 9], [6, 9, 1]]

queries 의 a, b, k 구성
```text
a b k
1 5 3
4 8 7
6 9 1
```

그리고 queries 를 수행하는 과정은 아래와 같다.
```text
index->	 1 2 3  4  5 6 7 8 9 10    1부터 시작하는 인덱스
        [0,0,0, 0, 0,0,0,0,0, 0]   처음에는 0으로 채워져 있다.
        [3,3,3, 3, 3,0,0,0,0, 0]   1 ~ 5 까지 3으로 채운다.
        [3,3,3,10,10,7,7,7,0, 0]   4 ~ 8 까지 7로 채우는데 이미 3이 있다면 3을 더해서 채운다.
        [3,3,3,10,10,8,8,8,1, 0]   6 ~ 9 까지 1로 채우는데 이미 숫자가 있다면 그 숫자에 1을 더해서 채워준다.
```

마지막으로 만들어진 배열에서 가장 큰 값은 10이므로 10을 반환한다.

### 제약조건

* 3 <= n <= 10^7
* 1 <= m <= 2 * 10^5
* 1 <= a <= b <= n
* 0 <= k <= 10^9

## 나의 풀이

이번 문제 난이도가 높아서 그런지 아무리 생각해도 이중for문을 사용하지 않고 구하는 방법이 떠오르지 않아서 구글링을 좀 해보았다.
a부터 b 까지 모두 채울필요 없이 시작하는 부분에 k를 더하고 끝나는 다음 인덱스에 k를 빼주는 방법을 사용하면 될 줄이야..
이렇게 만든 배열을 처음부터 끝까지 모두 더하며 최고값을 찾으면 for문 2개로 깔끔하게 끝이 난다.

```java
public static long arrayManipulation(int n, List<List<Integer>> queries) {
    long[] arr = new long[n];
    
    for (List<Integer> query : queries) {
        int a = query.get(0);
        int b = query.get(1);
        int k = query.get(2);
        
        arr[a - 1] += k;
        
        if (b < n) {
            arr[b] -= k;
        }
    }
    
    long max = 0;
    long sum = 0;
    
    for (long a : arr) {
        sum += a;
        if (max < sum) {
            max = sum;
        }
    }
    
    return max;
}
```