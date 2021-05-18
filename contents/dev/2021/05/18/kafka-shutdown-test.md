오늘의 테스트는 셧다운 테스트로 producer, consumer 가 kafka 를 사용하고 있는 중에 리더 노드를 포함한 노드 2개가 내려갔을 경우 정상적으로 메시지를 처리하는 것을 확인하는 것이다.

![shutdown1]()

파티션이 3으로 설정된 토픽을 사용할 것이며 모든 파티션으로 고르게 요청을 보낼 수 있도록 
producer 에는 `props.put(ProducerConfig.PARTITIONER_CLASS_CONFIG, RoundRobinPartitioner.class.getName());`를 추가했다.
이제 producer, consumer 를 실행시키고 1, 2 노드를 내려보자.

![shutdown2]()

1, 2 노드가 내려갔다는 경고를 확인할 수 있고

![shutdown3]()

모든 리더노드가 3으로 변경된 것을 확인할 수 있다.

그리고 procuder, consumer 의 상태를 보니 정상적으로 데이터를 수신하고 있는 것을 확인할 수 있었다.

Producer
```
1922. Record sent with key [136fb5ca-e4b4-4e09-afea-fe8c9282c76c] to partition 0 with offset 640
1923. Record sent with key [136fb5ca-e4b4-4e09-afea-fe8c9282c76c] to partition 1 with offset 640
1924. Record sent with key [136fb5ca-e4b4-4e09-afea-fe8c9282c76c] to partition 2 with offset 641
1925. Record sent with key [136fb5ca-e4b4-4e09-afea-fe8c9282c76c] to partition 0 with offset 641
```

Consumer
```
1922. kafka-consumer-consumer-group-2-2: message count: 1
ConsumerRecord(topic = test-topic-2, partition = 2, leaderEpoch = 9, offset = 638, CreateTime = 1621300730945, serialized key size = 36, serialized value size = 53, headers = RecordHeaders(headers = [], isReadOnly = false), key = 136fb5ca-e4b4-4e09-afea-fe8c9282c76c, value = perfect message. 136fb5ca-e4b4-4e09-afea-fe8c9282c76c)
1923. kafka-consumer-consumer-group-2-2: message count: 1
ConsumerRecord(topic = test-topic-2, partition = 2, leaderEpoch = 9, offset = 639, CreateTime = 1621300731250, serialized key size = 36, serialized value size = 53, headers = RecordHeaders(headers = [], isReadOnly = false), key = 136fb5ca-e4b4-4e09-afea-fe8c9282c76c, value = perfect message. 136fb5ca-e4b4-4e09-afea-fe8c9282c76c)
1924. kafka-consumer-consumer-group-2-2: message count: 1
ConsumerRecord(topic = test-topic-2, partition = 2, leaderEpoch = 9, offset = 640, CreateTime = 1621300731556, serialized key size = 36, serialized value size = 53, headers = RecordHeaders(headers = [], isReadOnly = false), key = 136fb5ca-e4b4-4e09-afea-fe8c9282c76c, value = perfect message. 136fb5ca-e4b4-4e09-afea-fe8c9282c76c)
1925. kafka-consumer-consumer-group-2-2: message count: 1
ConsumerRecord(topic = test-topic-2, partition = 2, leaderEpoch = 9, offset = 641, CreateTime = 1621300731862, serialized key size = 36, serialized value size = 53, headers = RecordHeaders(headers = [], isReadOnly = false), key = 136fb5ca-e4b4-4e09-afea-fe8c9282c76c, value = perfect message. 136fb5ca-e4b4-4e09-afea-fe8c9282c76c)
```

처리한 메시지 개수도 똑같은 것을 확인할 수 있다.
방금 실행한 테스트는 `ctrl-c`로 셧다운(정상적인 셧다운)을 실행했는데 이 번에는 창을 강제로 닫아서 같은 결과를 얻을 수 있는 지 확인해 보겠다.

테스트를 해보니 producer 는 큰 문제가 없었지만 consumer 쪽에서 에러가 발생하며 종료가 됐다.
```
2050. kafka-consumer-consumer-group-2-1: message count: 1
ConsumerRecord(topic = test-topic-2, partition = 1, leaderEpoch = 13, offset = 2385, CreateTime = 1621301647274, serialized key size = 36, serialized value size = 53, headers = RecordHeaders(headers = [], isReadOnly = false), key = e0852efc-676d-4775-9321-942e45867ad4, value = perfect message. e0852efc-676d-4775-9321-942e45867ad4)
Exception in thread "kafka-consumer-consumer-group-2-2" org.apache.kafka.common.errors.TimeoutException: Timeout of 5000ms expired before successfully committing offsets {test-topic-2-2=OffsetAndMetadata{offset=2389, leaderEpoch=15, metadata=''}}
Exception in thread "kafka-consumer-consumer-group-2-0" org.apache.kafka.common.errors.TimeoutException: Timeout of 5000ms expired before successfully committing offsets {test-topic-2-0=OffsetAndMetadata{offset=2389, leaderEpoch=16, metadata=''}}
Exception in thread "kafka-consumer-consumer-group-2-1" org.apache.kafka.common.errors.TimeoutException: Timeout of 5000ms expired before successfully committing offsets {test-topic-2-1=OffsetAndMetadata{offset=2387, leaderEpoch=13, metadata=''}}
```
3개 thread 모두 timeout 이 발생했고 아마도 정상종료일 경우에는 consumer 에게 신호를 주면서 내려가지만 강제종료일 경우에는 신호를 주지 못하기 때문에 발생하는 것으로 보인다.
에러가 발생하면 내 코드 중에서 `onError`로 전달되는데 에러 로그만 출력하고 그대로 진행할 수 있도록 하고 테스트해 보았다.
에러로그가 출력됐지만 consumer 는 계속 메시지를 처리했으며 3번 노드를 내렸었기 때문에 모든 리더노드들이 1, 2로 변경된것도 확인했다. (중간에 다시 3번 노드를 실행했다.)

Producer
```
2998. Record sent with key [7cace941-a4ba-4e19-862e-81c9c5cf4d92] to partition 2 with offset 4162
2999. Record sent with key [7cace941-a4ba-4e19-862e-81c9c5cf4d92] to partition 0 with offset 4162
3000. Record sent with key [7cace941-a4ba-4e19-862e-81c9c5cf4d92] to partition 1 with offset 4159
```

Consumer
```
2998. kafka-consumer-consumer-group-2-0: message count: 1
ConsumerRecord(topic = test-topic-2, partition = 0, leaderEpoch = 20, offset = 4160, CreateTime = 1621302837199, serialized key size = 36, serialized value size = 53, headers = RecordHeaders(headers = [], isReadOnly = false), key = 7cace941-a4ba-4e19-862e-81c9c5cf4d92, value = perfect message. 7cace941-a4ba-4e19-862e-81c9c5cf4d92)
2999. kafka-consumer-consumer-group-2-0: message count: 1
ConsumerRecord(topic = test-topic-2, partition = 0, leaderEpoch = 20, offset = 4161, CreateTime = 1621302837503, serialized key size = 36, serialized value size = 53, headers = RecordHeaders(headers = [], isReadOnly = false), key = 7cace941-a4ba-4e19-862e-81c9c5cf4d92, value = perfect message. 7cace941-a4ba-4e19-862e-81c9c5cf4d92)
3000. kafka-consumer-consumer-group-2-0: message count: 1
ConsumerRecord(topic = test-topic-2, partition = 0, leaderEpoch = 20, offset = 4162, CreateTime = 1621302837807, serialized key size = 36, serialized value size = 53, headers = RecordHeaders(headers = [], isReadOnly = false), key = 7cace941-a4ba-4e19-862e-81c9c5cf4d92, value = perfect message. 7cace941-a4ba-4e19-862e-81c9c5cf4d92)
```

3000개의 모든 메시지도 정상적으로 처리했다.

**신기했던 건 3개의 파티션중 하나는 1번 노드, 나머지 2개는 2번 노드가 리더노드로 설정돼 있었는데 어느 순간 1, 2, 3으로 고르게 변경돼 있었다.**
Kafka는 정말 안정적으로 잘 만들어졌다 :) 









