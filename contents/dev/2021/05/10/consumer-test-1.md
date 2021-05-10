자바코드를 작성하여 consumer 테스트를 진행해 보자. 
우선 간단하게 consumer 들을 관리하는 group 클래스를 만들고 polling 하며 메시지를 꺼내서 처리할 수 있도록 해주는 클래스를 만들었다.

**class KafkaConsumerGroup<K, V>**
```java
package kafka.consumer;

import org.apache.kafka.clients.consumer.Consumer;
import org.apache.kafka.clients.consumer.ConsumerRecords;
import org.apache.kafka.clients.consumer.KafkaConsumer;

import java.time.Duration;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Properties;

public class KafkaConsumerGroup<K, V> {
    private String groupId;
    private List<GroupWorker> consumerWorkers;

    private KafkaConsumerGroup(String groupId, int consumerSize, Properties consumerProps, ConsumerMessageHandler<K,V> messageHandler, String... topics) {
        this.groupId = groupId;
        consumerWorkers = new ArrayList<>(consumerSize);

        for (int i = 0; i < consumerSize; ++i) {
            consumerWorkers.add(new GroupWorker(i, consumerProps, topics, messageHandler));
        }
    }

    public void start() {
        consumerWorkers.forEach(GroupWorker::start);
    }

    public void stop() {
        consumerWorkers.forEach(GroupWorker::stop);
    }

    private class GroupWorker implements Runnable {
        private int workerId;
        private Consumer<K, V> kafkaConsumer;
        private String[] topics;
        private ConsumerMessageHandler<K, V> messageHandler;

        private volatile boolean isRunning;

        GroupWorker(int id, Properties properties, String[] topics, ConsumerMessageHandler<K,V> messageHandler) {
            workerId = id;
            kafkaConsumer = new KafkaConsumer<>(properties);
            this.topics = topics;
            this.messageHandler = messageHandler;
        }

        @Override
        public void run() {
            kafkaConsumer.subscribe(Arrays.asList(topics));
            Duration pollDuration = Duration.ofMillis(100);
            Duration commitDuration = Duration.ofSeconds(5);

            while (isRunning) {
                ConsumerRecords<K, V> records = kafkaConsumer.poll(pollDuration);
                kafkaConsumer.commitSync(commitDuration);

                if (records.count() > 0) {
                    try {
                        if (messageHandler.onReceive(records)) {
                            kafkaConsumer.commitSync(commitDuration);
                        }
                    } catch (Exception e) {
                        messageHandler.onError(records, e);
                    }
                } else {
                    try {
                        Thread.sleep(3000);
                    } catch (InterruptedException e) {
                        // ignore
                    }
                }
            }
        }

        void start() {
            isRunning = true;
            Thread t = new Thread(this);
            t.setName("kafka-consumer-" + groupId + "-" + workerId);
            t.start();
        }

        void stop() {
            isRunning = false;
        }
    }

    public static class Builder<T1, T2> {
        private String groupId;
        private int consumerSize;
        private Properties consumerProps;
        private ConsumerMessageHandler<T1, T2> messageHandler;
        private String[] topics;

        public Builder() {

        }

        public Builder<T1, T2> groupId(String groupId) {
            groupId = groupId.trim();

            if (!groupId.isEmpty()) {
                this.groupId = groupId;
            }
            return this;
        }

        public Builder<T1, T2> consumerSize(int consumerSize) {
            if (consumerSize > 0) {
                this.consumerSize = consumerSize;
            }
            return this;
        }

        public Builder<T1, T2> consumerProps(Properties props) {
            this.consumerProps = props;
            return this;
        }

        public Builder<T1, T2> messageHandler(ConsumerMessageHandler<T1, T2> messageHandler) {
            this.messageHandler = messageHandler;
            return this;
        }

        public Builder<T1, T2> topics(String... topics) {
            if (topics.length > 0) {
                this.topics = topics;
            }
            return this;
        }

        public KafkaConsumerGroup<T1, T2> build() {
            if (this.groupId == null) {
                throw new IllegalArgumentException("GroupID is empty.");
            }

            if (consumerSize == 0) {
                throw new IllegalArgumentException("Consumer size is zero.");
            }

            if (topics.length == 0) {
                throw new IllegalArgumentException("Topic is empty.");
            }

            if (messageHandler == null) {
                throw new IllegalArgumentException("Consumer message handler is null.");
            }

            return new KafkaConsumerGroup<>(groupId, consumerSize, consumerProps, messageHandler, topics);
        }
    }
}
```
위 클래스에서 사용되는 message handler.

**interface ConsumerMessageHandler<K, V>**
```java
package kafka.consumer;

import org.apache.kafka.clients.consumer.ConsumerRecords;

public interface ConsumerMessageHandler<K, V> {
    boolean onReceive(ConsumerRecords<K, V> records);

    void onError(ConsumerRecords<K, V> record, Exception e);
}
```

그리고 테스트 실행을 위한 main 을 작성한다.

```java
package kafka.consumer;

import kafka.ContextValue;
import org.apache.kafka.clients.consumer.ConsumerConfig;
import org.apache.kafka.clients.consumer.ConsumerRecords;
import org.apache.kafka.common.serialization.StringDeserializer;

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

        KafkaConsumerGroup kafkaConsumerGroup = new KafkaConsumerGroup.Builder<String, String>()
                .groupId(groupId)
                .consumerProps(props)
                .consumerSize(3)
                .topics(ContextValue.TOPIC_ID)
                .messageHandler(new ConsumerMessageHandler<>() {
                    @Override
                    public boolean onReceive(ConsumerRecords<String, String> records) {
                        System.out.println(Thread.currentThread().getName() + ": message count: " + records.count());
                        records.forEach(System.out::println);
                        return true;
                    }

                    @Override
                    public void onError(ConsumerRecords<String, String> record, Exception e) {
                        e.printStackTrace();
                    }
                })
                .build();

        kafkaConsumerGroup.start();
    }
}
```

실행하면 메시지를 처리하게 위해서 기다리고 있는데 메시지를 넣고 로그를 확인해 보았다.
```
kafka-consumer-consumer-group-1-0: message count: 1
ConsumerRecord(topic = test-topic-1, partition = 0, leaderEpoch = 0, offset = 23, CreateTime = 1620627285186, serialized key size = 36, serialized value size = 53, headers = RecordHeaders(headers = [], isReadOnly = false), key = 75f58c70-988e-430e-b259-e25f304ee01c, value = perfect message. 75f58c70-988e-430e-b259-e25f304ee01c)
kafka-consumer-consumer-group-1-0: message count: 1
ConsumerRecord(topic = test-topic-1, partition = 0, leaderEpoch = 0, offset = 24, CreateTime = 1620627285252, serialized key size = 36, serialized value size = 53, headers = RecordHeaders(headers = [], isReadOnly = false), key = 75f58c70-988e-430e-b259-e25f304ee01c, value = perfect message. 75f58c70-988e-430e-b259-e25f304ee01c)
kafka-consumer-consumer-group-1-0: message count: 1
ConsumerRecord(topic = test-topic-1, partition = 0, leaderEpoch = 0, offset = 25, CreateTime = 1620627285255, serialized key size = 36, serialized value size = 53, headers = RecordHeaders(headers = [], isReadOnly = false), key = 75f58c70-988e-430e-b259-e25f304ee01c, value = perfect message. 75f58c70-988e-430e-b259-e25f304ee01c)
kafka-consumer-consumer-group-1-0: message count: 1
ConsumerRecord(topic = test-topic-1, partition = 0, leaderEpoch = 0, offset = 26, CreateTime = 1620627285257, serialized key size = 36, serialized value size = 53, headers = RecordHeaders(headers = [], isReadOnly = false), key = 75f58c70-988e-430e-b259-e25f304ee01c, value = perfect message. 75f58c70-988e-430e-b259-e25f304ee01c)
kafka-consumer-consumer-group-1-0: message count: 1
ConsumerRecord(topic = test-topic-1, partition = 0, leaderEpoch = 0, offset = 27, CreateTime = 1620627285262, serialized key size = 36, serialized value size = 53, headers = RecordHeaders(headers = [], isReadOnly = false), key = 75f58c70-988e-430e-b259-e25f304ee01c, value = perfect message. 75f58c70-988e-430e-b259-e25f304ee01c)
kafka-consumer-consumer-group-1-0: message count: 1
ConsumerRecord(topic = test-topic-1, partition = 0, leaderEpoch = 0, offset = 28, CreateTime = 1620627285264, serialized key size = 36, serialized value size = 53, headers = RecordHeaders(headers = [], isReadOnly = false), key = 75f58c70-988e-430e-b259-e25f304ee01c, value = perfect message. 75f58c70-988e-430e-b259-e25f304ee01c)
```
`kafka-consumer-consumer-group-1-0` 이 로그의 마지막에 `0`이 thread 의 index 인데 하나의 thread 만 처리하는 것을 볼 수 있다.
topic 의 offset은 그룹별로 관리가 되지만 partition 은 consumer 별로 따로 가져가기 때문이다.(현재 사용 중인 topic 은 partition 이 1이다.)
partition 을 3으로 설정해서 새로운 topic 을 생성하게 되면 이제 group 안의 각 consumer 들에게 하나씩 배분된다. (`consumerSize` 를 3으로 해서 생성했기 때문에)

하지만 이대로 실행하게 되면 여전히 하나의 thread 만 처리하게 되는데 이유는 producer 에서 하나의 partition 에만 메시지를 저장하고 있기 때문에이다.
producer 에서 모든 파티션에 동일하게 배분할 수 있도록 `ProducerConfig.PARTITIONER_CLASS_CONFIG` 설정을 추가해 주자.
```java
props.put(ProducerConfig.PARTITIONER_CLASS_CONFIG, RoundRobinPartitioner.class.getName());
```
`RoundRobinPartitioner` 는 기본적으로 제공해 주는 클래스로 모든 모든 파티션에 메시지를 분배해 준다.

다시 로그를 확인해 보면
```
kafka-consumer-consumer-group-2-1: message count: 1
ConsumerRecord(topic = test-topic-2, partition = 1, leaderEpoch = 0, offset = 39, CreateTime = 1620629906621, serialized key size = 36, serialized value size = 53, headers = RecordHeaders(headers = [], isReadOnly = false), key = 813f3b9c-0e1e-4b36-946c-b248f5e468b0, value = perfect message. 813f3b9c-0e1e-4b36-946c-b248f5e468b0)
kafka-consumer-consumer-group-2-0: message count: 1
ConsumerRecord(topic = test-topic-2, partition = 0, leaderEpoch = 0, offset = 0, CreateTime = 1620629988803, serialized key size = 36, serialized value size = 53, headers = RecordHeaders(headers = [], isReadOnly = false), key = df53e2bf-2afc-4ff0-a28c-19a561be37be, value = perfect message. df53e2bf-2afc-4ff0-a28c-19a561be37be)
kafka-consumer-consumer-group-2-2: message count: 1
ConsumerRecord(topic = test-topic-2, partition = 2, leaderEpoch = 0, offset = 0, CreateTime = 1620629988740, serialized key size = 36, serialized value size = 53, headers = RecordHeaders(headers = [], isReadOnly = false), key = df53e2bf-2afc-4ff0-a28c-19a561be37be, value = perfect message. df53e2bf-2afc-4ff0-a28c-19a561be37be)
kafka-consumer-consumer-group-2-0: message count: 1
ConsumerRecord(topic = test-topic-2, partition = 0, leaderEpoch = 0, offset = 1, CreateTime = 1620629988850, serialized key size = 36, serialized value size = 53, headers = RecordHeaders(headers = [], isReadOnly = false), key = df53e2bf-2afc-4ff0-a28c-19a561be37be, value = perfect message. df53e2bf-2afc-4ff0-a28c-19a561be37be)
kafka-consumer-consumer-group-2-2: message count: 1
ConsumerRecord(topic = test-topic-2, partition = 2, leaderEpoch = 0, offset = 1, CreateTime = 1620629988846, serialized key size = 36, serialized value size = 53, headers = RecordHeaders(headers = [], isReadOnly = false), key = df53e2bf-2afc-4ff0-a28c-19a561be37be, value = perfect message. df53e2bf-2afc-4ff0-a28c-19a561be37be)
kafka-consumer-consumer-group-2-0: message count: 1
```
`kafka-consumer-consumer-group-2-1` 이 부분을 보면 0, 1, 2 모두 실행되는 것을 볼 수 있고 web admin 에서도 2번 partition만 사용되다가 1, 2도 사용된 것을 볼 수 있다.

![web admin](/contents/dev/2021/05/10/image/test-1.png)

** 지금까지 알게된 비지니스에 맞게 조절해야 하는 요소**
- consumer group 안에 consumer 개수
- topic 의 partition 개수
- producer 의 partition 배분 전략
- commit 사용 방법
- 재처리
