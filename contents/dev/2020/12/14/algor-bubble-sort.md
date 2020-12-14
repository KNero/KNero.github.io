# 버블정렬

옆에 있는 값과 비교하여 더 작은 값을 앞으로 보낸다.

```
package algorithm;

public class BubbleSort {
    public static void main(String[] args)
    {
        int[] num = {1, 10, 5, 8, 7, 6, 4, 3, 2, 9};
        for (int i = 0; i < num.length; ++i)
        {
            for (int k = 0; k < num.length - 1 - i; ++k)
            {
                if (num[k] > num[k + 1])
                {
                    int t = num[k];
                    num[k] = num[k + 1];
                    num[k + 1] = t;
                }
            }
            
            for (int n : num)
            {
                System.out.print(n + " ");
            }
            System.out.println();
        }
    }
}
```

### 시간복잡도
```
O(n^2)

계산횟수 = 10 + 9 + 8 + 7 + 6 + ... + 1 (등차수열)

=> 10 * (10 + 1) / 2 = 55
=> N * (N + 1) / 2
=> N * N
```

**시간복잡도는 버블정렬과 같지만 선택정렬은 가장 적은 것을 찾아서 변경작업을 하지만 버블 정렬은 매번 변경을 해줘야 하기 때문에 더 비효율적이다.**