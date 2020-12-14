# 선택정렬

가장 작은 값을 찾아서 선택한 값과 자리를 변경해 준다.

```
package algorithm;

public class SelectionSort {
    public static void main(String[] args)
    {
        int[] num = {1, 10, 5, 8, 7, 6, 4, 3, 2, 9};
        for (int i = 0; i < num.length; ++i)
        {
            int minK = i;
            for (int k = i + 1; k < num.length; ++k)
            {
                if (num[minK] > num[k])
                {
                    minK = k;
                }
            }

            int t = num[i];
            num[i] = num[minK];
            num[minK] = t;

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

