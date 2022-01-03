HackerRank 의 Interview Prepaaration Kit 에 있는 Arrays 문제 중 Minimum Swaps 2 문제.

`Practice > Interview Preparation Kit > Arrays > Minimum Swaps 2 (Medium)`

## 문제설명

정렬되지 않으며 중복되지 않은 숫자가 연속적으로 구성되어진 배열이 주어진다. 
두 개의 숫자를 바꿀 수 있는데 이 배열을 오른차순으로 변경하기 위해서 최소한 몇 번 숫자를 바꿔야 하는가.

### Example

arr = [7, 1, 3, 2, 4, 5, 6]

이 배열은 아래 순서에 따라서 정렬된다.

```text
i   arr                     swap (indices)
0   [7, 1, 3, 2, 4, 5, 6]   swap (0,3)
1   [2, 1, 3, 7, 4, 5, 6]   swap (0,1)
2   [1, 2, 3, 7, 4, 5, 6]   swap (3,4)
3   [1, 2, 3, 4, 7, 5, 6]   swap (4,5)
4   [1, 2, 3, 4, 5, 7, 6]   swap (5,6)
5   [1, 2, 3, 4, 5, 6, 7]
```

총 5번 변경해서 배열을 정렬했으며 그러므로 5를 반환하면 된다.

### 제약조건

* 1 <= n <= 10^5
* 1 <= arr[i] <= n

## 나의 풀이

첫 번째 방법은 배열의 숫자별 위치를 미리 Map 에 저장해 두고 순환하면서 해당 위치에 있어야 할 숫자와 자리를 바꿔주는 것이다.
공간복잡도는 올라가지만 시간복잡도는 낮출 수 있다.

```java
static int minimumSwaps(int[] arr) {
    int count = 0;
    
    HashMap<Integer, Integer> map = new HashMap<>();
    for (int i = 0; i < arr.length; ++i) {
        map.put(arr[i], i);
    }
    
    for (int i = 0; i < arr.length; ++i) {
        int v = i + 1;
        if (arr[i] != v) {
            int vIndex = map.get(v);
            int temp = arr[vIndex];
            arr[vIndex] = arr[i];
            arr[i] = temp;
            map.put(arr[i], i);
            map.put(arr[vIndex], vIndex);
            ++count;
        }
    }
    
    return count;
}
```

두 번째 방법은 Map에 저장하지 않고 for문을 중복하여 해당 위치에 있어야 할 숫자를 찾아 바꿔주는 것이다.
시간복잡도는 올라가지만 이 방법도 테스트를 모두 통과할 수 있다.

```java
static int minimumSwaps(int[] arr) {
    int result = 0;
    
    for (int i = 0; i < arr.length; ++i) {
        if (arr[i] != i + 1) {
            for (int j = i; j < arr.length; ++j) {
                if (arr[j] == i + 1) {
                    int temp = arr[j];
                    arr[j] = arr[i];
                    arr[i] = temp;
                    ++result;
                    break;
                }
            }
        }
    }
    
    return result;
}
```

두 풀이의 공통점은 해당 인덱스에 있어야할 숫자를 찾아서 변경해 주는 것이다. 예를 들어 0번 인덱스에는 1이 있어야 하므로 1을 찾아서 0번 인덱스의 숫자와 변경해 준다.
이렇게 0번 인덱스부터 하나씩 숫자를 맞춰 나가면 최소한의 변경 횟수를 찾을 수 있다.

Example 에서는 이런 방식으로 변경하지 않았지만 결과는 똑같이 나온다.