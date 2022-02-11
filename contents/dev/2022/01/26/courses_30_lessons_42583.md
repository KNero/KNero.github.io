## 다리를 지나는 트럭

### 문제

트럭 여러 대가 강을 가로지르는 일차선 다리를 정해진 순으로 건너려 합니다. 모든 트럭이 다리를 건너려면 최소 몇 초가 걸리는지 알아내야 합니다. 다리에는 트럭이 최대 bridge_length대 올라갈 수 있으며, 다리는 weight 이하까지의 무게를 견딜 수 있습니다. 단, 다리에 완전히 오르지 않은 트럭의 무게는 무시합니다.

예를 들어, 트럭 2대가 올라갈 수 있고 무게를 10kg까지 견디는 다리가 있습니다. 무게가 [7, 4, 5, 6]kg인 트럭이 순서대로 최단 시간 안에 다리를 건너려면 다음과 같이 건너야 합니다.

```text
경과 시간     다리를 지난 트럭    다리를 건너는 트럭    대기 트럭
0            []                 []                   [7,4,5,6]
1~2          []                 [7]                  [4,5,6]
3            [7]                [4]                  [5,6]
4            [7]                [4,5]                [6]
5            [7,4]              [5]                  [6]
6~7          [7,4,5]            [6]                  []
8            [7,4,5,6]          []                   []
```

따라서, 모든 트럭이 다리를 지나려면 최소 8초가 걸립니다.

solution 함수의 매개변수로 다리에 올라갈 수 있는 트럭 수 bridge_length, 다리가 견딜 수 있는 무게 weight, 트럭 별 무게 truck_weights가 주어집니다. 이때 모든 트럭이 다리를 건너려면 최소 몇 초가 걸리는지 return 하도록 solution 함수를 완성하세요.

### 제한사항

- bridge_length는 1 이상 10,000 이하입니다.
- weight는 1 이상 10,000 이하입니다.
- truck_weights의 길이는 1 이상 10,000 이하입니다.
- 모든 트럭의 무게는 1 이상 weight 이하입니다.

### 예제

```text
bridge_length    weight    truck_weights                      return
2                10        [7,4,5,6]                          8
100              100       [10]                               101
100              100       [10,10,10,10,10,10,10,10,10,10]    110
```

### 풀이
```java
import java.util.*;

class Truck {
    private int weight;
    private int position;
    
    public Truck(int weight, int position) {
        this.weight = weight;
        this.position = position;
    }
    
    public int getWeight() {
        return weight;
    }
    
    public int getPosition() {
        return position;
    }
    
    public void move() {
        ++position;
    }
    
    @Override
    public String toString() {
        return weight + "/" + position;
    }
}

class Solution {
    public int solution(int bridge_length, int weight, int[] truck_weights) {
        int time = 0;
        Queue<Truck> bridgeTrucks = new LinkedList<>();
        int onWeight = 0;
        int index = 0;
        
        while (true) {
            for (Truck t : bridgeTrucks) {
                t.move();
            }
            
            Truck t = bridgeTrucks.peek();
            if (t != null && t.getPosition() > bridge_length) {
                t = bridgeTrucks.poll();
                onWeight -= t.getWeight();
            }
            
            if (index < truck_weights.length) {
                int tw = truck_weights[index];
                
                if (bridgeTrucks.size() < bridge_length && onWeight + tw <= weight) {
                    onWeight += tw;
                    bridgeTrucks.add(new Truck(tw, 1));
                    ++index;
                }
            }
            
            ++time;
            
            if (bridgeTrucks.isEmpty()) {
                break;
            }
        }
        
        return time;
    }
}
```