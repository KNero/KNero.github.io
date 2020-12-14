# 삽입정렬

각 숫자를 적절한 위치에 삽입하는 방법으로 적절한 위치를 찾아서 삽입해 준다.

### 진행과정
```
1, 10, 5, 8, 7, 6, 4, 3, 2, 9
1, 5, 10, 8, 7, 6, 4, 3, 2, 9
1, 5, 8, 10, 7, 6, 4, 3, 2, 9
1, 5, 7, 8, 10, 6, 4, 3, 2, 9
1, 5, 6, 7, 8, 10, 4, 3, 2, 9
...
```

**선택한 숫자에서 앞쪽으로 삽입해야할 위치를 찾아가며 앞쪽이 더 작다면 교체를 멈추고 다음 숫자를 검사한다.**


```
package algorithm;

public class InsertionSort {
    public static void main(String[] args)
    {
        int[] num = {1, 10, 5, 8, 7, 6, 4, 3, 2, 9};
        for (int i = 0; i < num.length - 1; ++i)
        {
            int j = i;
            while (num[j] > num[j + 1])
            {
                int t = num[j];
                num[j] = num[j + 1];
                num[j + 1] = t;
                --j;
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
O(n^2)

버블정렬과 선택정렬과 같은 시간복잡도를 갖지만 연산횟수가 가장 적게 일어나고 앞쪽의 숫자는 다 정렬이 되었다고 가정하기 때문에 거의 정렬된 상태라면 아주 빠르게 동작할 수 있다.