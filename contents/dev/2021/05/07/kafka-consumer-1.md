Consumer 의 다른 Config 는 차후에 정리하고 우선 Producer 로 저장한 메시지를 꺼내보자.
```java
import kafka.ContextValue;
import org.apache.kafka.clients.consumer.*;
import org.apache.kafka.common.serialization.StringDeserializer;

import java.time.Duration;
import java.util.Collections;
import java.util.Properties;

public class ConsumerTest {
    public static void main(String[] args) {
        final String groupId = "consumer-group-1";
        final int maxPollRecords = 1;
        final String autoOffsetReset = "earliest";

        Properties props = new Properties();
        props.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, ContextValue.KAFKA_BROKERS_ADDRESS);
        props.put(ConsumerConfig.GROUP_ID_CONFIG, groupId);
        props.put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class.getName());
        props.put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class.getName());
        props.put(ConsumerConfig.MAX_POLL_RECORDS_CONFIG, maxPollRecords);
        props.put(ConsumerConfig.ENABLE_AUTO_COMMIT_CONFIG, false);
        props.put(ConsumerConfig.AUTO_OFFSET_RESET_CONFIG, autoOffsetReset);

        Consumer<String, String> consumer = new KafkaConsumer<>(props);
        consumer.subscribe(Collections.singletonList(ContextValue.TOPIC_ID));

        try {
            Duration duration = Duration.ofSeconds(1);
            ConsumerRecords<String, String> records = consumer.poll(duration);

            consumer.commitSync(Duration.ofSeconds(5));

            System.out.println("message count: " + records.count());

            records.forEach(System.out::println);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}

```
카프카는 Consumer Group 을 기준으로 offset 관리를 한다는 점이 중요하다. 같은 Group 에 속해 있을 경우 그 group의 consumer들은 같은 offset의 메시지를 가져가지 않고 분배된다.
[Consumer Group 설명 블로그](https://jhleed.tistory.com/180#:~:text=%EC%BB%A8%EC%8A%88%EB%A8%B8%20%EA%B7%B8%EB%A3%B9(Consumer%20Group)%20%EC%9D%B4%EB%9E%80,%EB%AC%B6%EB%8A%94%20%EB%85%BC%EB%A6%AC%EC%A0%81%20%EA%B7%B8%EB%A3%B9%20%EB%8B%A8%EC%9C%84%EC%9D%B4%EB%8B%A4.)

`ConsumerConfig.ENABLE_AUTO_COMMIT_CONFIG` 를 `false` 로 설정했기 때문에 메시지를 가져온 후 **commitSync** 를 실행하지 않으면 다음에도 같은 메시지를 가져오므로 신경써주자.

`ConsumerConfig.AUTO_OFFSET_RESET_CONFIG` 는 새로운 consumer group 이 생성될 경우 offset 을 어떻게 시작할 것인가를 설정한다.
```
earliest: 0 부터 시작
latest: 가장 최근에 읽은 offset 부터 시작
```

코드를 실행하고 난 후에 **Topics** 부분을 확인하면 consumer 의 offset 을 관리하기 위한 Topic(**__consumer_offsets**) 이 생성되어 있는 것을 볼 수 있다. 
카프카는 consumer 의 offset 정보도 별도의 Topic 으로 만들어서 관리한다는 사실을 확인할 수 있다.

![consumer offset topic](/contents/dev/2021/05/07/image/consumer-1.png)

![consumer offset topic](/contents/dev/2021/05/07/image/consumer-2.png)

실행결과
```
message count: 1
ConsumerRecord(topic = test-topic-1, partition = 0, leaderEpoch = 0, offset = 0, CreateTime = 1620273209293, serialized key size = 36, serialized value size = 22, headers = RecordHeaders(headers = [], isReadOnly = false), key = ae49a604-ed34-4e36-967f-365f62fda240, value = this is first message!)
```

현재는 `ConsumerConfig.MAX_POLL_RECORDS_CONFIG` 값이 1이기 때문에 한 번의 `poll` 로 하나의 메시지만 가져왔지만 남은 2개를 모두 가져오기 위해서 10으로 설정해서 실행해 보겠다.

```
message count: 2
ConsumerRecord(topic = test-topic-1, partition = 0, leaderEpoch = 0, offset = 1, CreateTime = 1620274618523, serialized key size = -1, serialized value size = 22, headers = RecordHeaders(headers = [], isReadOnly = false), key = null, value = this is first message!)
ConsumerRecord(topic = test-topic-1, partition = 0, leaderEpoch = 0, offset = 2, CreateTime = 1620275878332, serialized key size = 36, serialized value size = 22, headers = RecordHeaders(headers = [RecordHeader(key = name, value = [107, 115, 109]), RecordHeader(key = where, value = [104, 111, 109, 101])], isReadOnly = false), key = d5f3c709-dfe7-4a57-83fb-eacf44402f83, value = this is first message!)
```
남은 메시지2개를 모두 가져오는 것을 볼 수 있다. (key 를 빈값으로 저장한 메시지는 key size 가 -1로 보인다.)

Topic 상세 페이지에서 오른쪽 하단을 보면 consumer group 정보가 있는데 그룹하나를 더 생성해서 메시지를 가져와 보자. 

![consumer offset topic](/contents/dev/2021/05/07/image/consumer-3.png)

새 group 을 생성해서 실행해 보니 **offset 0** 부터 모든 메시지를 가져온다.
```
message count: 3
ConsumerRecord(topic = test-topic-1, partition = 0, leaderEpoch = 0, offset = 0, CreateTime = 1620273209293, serialized key size = 36, serialized value size = 22, headers = RecordHeaders(headers = [], isReadOnly = false), key = ae49a604-ed34-4e36-967f-365f62fda240, value = this is first message!)
ConsumerRecord(topic = test-topic-1, partition = 0, leaderEpoch = 0, offset = 1, CreateTime = 1620274618523, serialized key size = -1, serialized value size = 22, headers = RecordHeaders(headers = [], isReadOnly = false), key = null, value = this is first message!)
ConsumerRecord(topic = test-topic-1, partition = 0, leaderEpoch = 0, offset = 2, CreateTime = 1620275878332, serialized key size = 36, serialized value size = 22, headers = RecordHeaders(headers = [RecordHeader(key = name, value = [107, 115, 109]), RecordHeader(key = where, value = [104, 111, 109, 101])], isReadOnly = false), key = d5f3c709-dfe7-4a57-83fb-eacf44402f83, value = this is first message!)
```
그리고 consumer group 정보에 group 이 하나더 추가돼 있다.

![consumer offset topic](/contents/dev/2021/05/07/image/consumer-4.png)

그룹을 클릭하면 상세페이지를 볼 수 있다.

![consumer offset topic](/contents/dev/2021/05/07/image/consumer-5.png)

![consumer offset topic](/contents/dev/2021/05/07/image/consumer-6.png)

이번에는 `ConsumerConfig.AUTO_OFFSET_RESET_CONFIG` 를 `latest` 로 수정해서 메시지를 가져와 보도록 하겠다.
```
message count: 0
```
offset 이 가장 최근에 읽은 offset 으로 세팅되기 때문에 가져오지 못 하는 것도 확인할 수 있다.
