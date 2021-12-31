HackerRank 의 Interview Prepaaration Kit 에 있는 Arrays 문제 중 2D Array - DS 문제.

`Practice > Interview Preparation Kit > Arrays > 2D Array - DS (Easy)`

## 문제설명

만약 6x6 배열이 아래와 같이 주어진다면
```
1 1 1 0 0 0
0 1 0 0 0 0
1 1 1 0 0 0
0 0 0 0 0 0
0 0 0 0 0 0
0 0 0 0 0 0
```
이 배열을 모래시계 모양으로 합을 구하면 변환한다면 4x4 배열이 된다.
```
a b c
  d
e f g
```
그리고 이렇게 구해진 4x4 행렬의 값 중 가장 큰 값을 반환해 준다.

### Example

```
-9 -9 -9  1 1 1 
 0 -9  0  4 3 2
-9 -9 -9  1 2 3
 0  0  8  6 6 0
 0  0  0 -2 0 0
 0  0  1  2 4 0
 ```

첫 번째 값 : -9 + -9 + -9 + -9 + -9 + -9 + -9 = -63
```
-9 -9 -9
   -9
-9 -9 -9
```

두 번째 값 : -9 + -9 + 1 + 0 + -9 + -9 + 1 = -34
```
-9 -9 1
    0
-9 -9 1
```

결과
```
-63, -34, -9, 12, 
-10,   0, 28, 23, 
-27, -11, -2, 10, 
  9,  17, 25, 18
```
그리고 이 중 가장 큰 값은 28이므로 28을 반환해 준다. (28은 아래 값들을 더해서 구해진다.)
```
0 4 3
  1
8 6 6
```

* 파라미터의 arr 은 int[6][6]의 형태이다.
* 모래시계 모양으로 합을 구한 배열에서 가장큰 값을 반환한다.

### 제약조건

* -9 <= arr[i][j] <= 9
* 0 <= i, j <= 5

## 나의 풀이

```
public static int hourglassSum(List<List<Integer>> arr) {
    int max = -99;
    
    for (int i = 0; i <= 21;) {
        int row1 = i / 6;
        int row2 = row1 + 1;
        int row3 = row2 + 1;
        int col1 = i % 6;
        int col2 = col1 + 1;
        int col3 = col2 + 1;
        
        int n1 = arr.get(row1).get(col1);
        int n2 = arr.get(row1).get(col2);
        int n3 = arr.get(row1).get(col3);
        int n4 = arr.get(row2).get(col2);
        int n5 = arr.get(row3).get(col1);
        int n6 = arr.get(row3).get(col2);
        int n7 = arr.get(row3).get(col3);
        
        int n = n1 + n2 + n3 + n4 + n5 + n6 + n7;
        if (max < n) {
            max = n;
        }
        
        if (col1 == 3) {
            i += 3;
        } else {
            ++i;
        }
    }
    
    return max;
}
```

파라미터가 6x6으로 고정되어 있다고 했기 때문에 모래시계 모양의 합을 구하고 i가 21일 때 for문을 빠져나오도록 했다.