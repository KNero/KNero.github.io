이제 web admin 을 사용하여 토픽을 생성하는 것을 시작으로 카프카를 사용해 보도록 하자. 
토픽을 생성하기 위해 맨 하단 부분인 Topics 밑의 **New** 버튼을 클릭하면 토핑 생성 화면으로 이동할 수 있다.

![create topic page](/contents/dev/2021/05/07/image/producer-1.png)

파티션 개수는 설정 후에는 줄일 수 없고 필요할 경우 늘리는 것은 가능하기 때문에 1로 설정했고 복제 개수는 브로커 개수만큼 자동으로 설정돼서 보이는데 기본 설정인 3을 사용했다. 
토픽 이름을 입력하고 **Create** 버튼을 누르면 메인화면에서 생성결과를 확인할 수 있다.

![topic creation](/contents/dev/2021/05/07/image/producer-2.png)

Overview 에서도 토픽의 개수를 확인할 수 있고 Brokers 에서도 2번 브로커에 파티션 1개가 보이는데 파티션이 3개로 복제되기는 하지만 파티션에 리더는 하나이므로 리더가 있는 브로커에만 1개로 표시된다.
Topics 에서 **test-topic-1**을 클릭하여 토픽의 세부정보를 확인해 보자.

![topic detail](/contents/dev/2021/05/07/image/producer-3.png)

여기서 리더노드와 복제정보, 오프셋 등을 확인할 수 있고 토픽삭제도 가능하다. 그리고 **View Message**라는 버튼을 누르면 토픽의 메시지를 확인할 수 있는 화면으로 이동하게 되는데 여기서 큐의 메시지를 볼 수 있을 것으로 보인다. (토픽 상세 페이지에서 **Partition Detail** 의 **Partition**의 숫자를 클릭해도 메시지 확인 화면으로 이동한다.)

이제 자바코드로 토픽에 값을 저장해 보자. **maven** 프로젝트를 만들고 디펜던시를 추가해주자.
```
<dependency>
    <groupId>org.apache.kafka</groupId>
    <artifactId>kafka-clients</artifactId>
    <version>2.8.0</version>
</dependency>
```
그리고 간단하게 Producer 코드를 작성해 준다.
```java
import org.apache.kafka.clients.producer.*;
import org.apache.kafka.common.serialization.StringSerializer;

import java.util.Properties;
import java.util.UUID;
import java.util.concurrent.ExecutionException;

public class ProducerTest {
    public static void main(String[] args) {
        final String kafkaBrokers = "localhost:9001,localhost:9002,localhost:9003";
        final String clientId = "Producer-1-1";

        // partition, Key, Value 관련 class 의 경우에는 커스터마이징이 가능하다.
        Properties props = new Properties();
        props.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, kafkaBrokers);
        props.put(ProducerConfig.CLIENT_ID_CONFIG, clientId);
        props.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class.getName());
        props.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, StringSerializer.class.getName());
        //props.put(ProducerConfig.PARTITIONER_CLASS_CONFIG, CustomPartitioner.class.getName());

        Producer<String, String> producer = new KafkaProducer<>(props);

        final String topicId = "test-topic-1";
        final String key = UUID.randomUUID().toString();
        final String value = "this is first message!";
        ProducerRecord<String, String> producerRecord = new ProducerRecord<>(topicId, key, value);

        try {
            RecordMetadata metadata = producer.send(producerRecord).get();
            System.out.println("Record sent with key [" + key + "] to partition " + metadata.partition() + " with offset " + metadata.offset());
        } catch (ExecutionException | InterruptedException e) {
            e.printStackTrace();
        }
    }
}
```
Producer 는 어느 파티션으로 메시지를 보낼 수 있는 지 지정할 수 있으나 지금은 파티션을 하나만 사용하고 있기 때문에 따로 설정하지 않았다.
실행을 하고 kafka web admin 의 topic 상세 페이지로 가보면 size, offset 이 늘어난 것을 확인할 수 있다.

![topic detail](/contents/dev/2021/05/07/image/producer-5.png)

그리고 **View Message** 버튼을 눌러서 메시지를 확인할 수 있는 페이지로 이동해서 조건 변경없이 검색을 해보자. Click View Message.

![view message](/contents/dev/2021/05/07/image/producer-6.png)

key, value 값을 바로 확인해 볼 수 있다. 이 기능은 테스트 단계에서는 아주 유용할 것 같다.

---

### 키값을 지정하지 않고 저장
```java
ProducerRecord<String, String> producerRecord = new ProducerRecord<>(topicId, value);
```
맨 밑의 메시지를 보면 자동으로 생성되지는 않고 key 값이 빈 값으로 저장되는 것을 확인할 수 있다.

![no key](/contents/dev/2021/05/07/image/producer-7.png)

---

### 헤더를 추가하여 전송
```java
ProducerRecord<String, String> producerRecord = new ProducerRecord<>(topicId, key, value);
producerRecord.headers().add(new RecordHeader("name", "ksm".getBytes()));
producerRecord.headers().add(new RecordHeader("where", "home".getBytes()));
```
맨 밑의 메시지를 보면 header 부분에 name, where 가 추가된 것을 볼 수 있다.

![with header](/contents/dev/2021/05/07/image/producer-8.png)
