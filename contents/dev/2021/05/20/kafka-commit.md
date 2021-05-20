[읽어보면 좋은 사이트](https://12bme.tistory.com/529)

## Kafka 중복, Commit
상단의 블로그에서 보면 카프카의 중복이 말생할 수 있다는 사실을 알 수 있다.
현재 카프카가 제공하는 **auto commit** 은 `poll` 을 실행했을 때 일정 주기가 지나면 commit 을 실행하기 때문에 commit과 commit 사이에 공백이 발생한다.
```text
enable.auto.commit=ture
auto.commit.interval.ms=5000
```
**이때 컨슈머가 갑자기 다운되거나 컨슈머 그룹에 새로운 컨슈머가 조인한다면 컨슈머 그룹 내에서 리밸런스가 일어나게 된다.**(자세한 내용은 상단 사이트 참고)

commit을 안했을 경우 같은 데이터를 계속 가져오는 현상을 쉽게 확인할 수 있는데 commit을 안하고 컨슈머를 정지한뒤 다시 실행하면 같은 메시지를 가져오는 것을 볼 수 있다.
commit 시점을 poll 이 아닌 다른 곳에서 하고 싶다면 수동으로 실행해 줘야 한다.

그리고 commit 을 하는 단위는 내가 가져온 전체 메시지 단위이기 때문에 `props.put(ConsumerConfig.MAX_POLL_RECORDS_CONFIG, 10);` 로 설정했다면 10개 전체가 commit 된다.

---

commit을 사용할 때 주의할 점은 `KafkaConsumer class` 의 commit 메소드를 사용하는데 `KafkaConsumer` 객체는 처음 할당된 thread 가 아닌 별도의 thread 에서 사용하면 예외가 발생한다.
만약 `poll` 을 통해서 메시지를 가져오고 내가 별도의 thread를 생성해서 처리한다면 새로 생성된 thread 에서 `commitSync` 을 실행할 경우 예외가 발생한다.
```text
Exception in thread "kafka-consumer-consumer-group-2-0-message-processor" java.util.ConcurrentModificationException: KafkaConsumer is not safe for multi-threaded access
	at org.apache.kafka.clients.consumer.KafkaConsumer.acquire(KafkaConsumer.java:2445)
	at org.apache.kafka.clients.consumer.KafkaConsumer.acquireAndEnsureOpen(KafkaConsumer.java:2429)
	at org.apache.kafka.clients.consumer.KafkaConsumer.commitSync(KafkaConsumer.java:1486)
	at org.apache.kafka.clients.consumer.KafkaConsumer.commitSync(KafkaConsumer.java:1390)
	at org.apache.kafka.clients.consumer.KafkaConsumer.commitSync(KafkaConsumer.java:1347)
	at kafka.consumer.KafkaConsumerGroup$GroupWorker.lambda$run$1(KafkaConsumerGroup.java:80)
	at java.base/java.util.concurrent.ThreadPoolExecutor.runWorker(ThreadPoolExecutor.java:1128)
	at java.base/java.util.concurrent.ThreadPoolExecutor$Worker.run(ThreadPoolExecutor.java:628)
	at java.base/java.lang.Thread.run(Thread.java:835)
```
Kafka 코드에 thread id 를 비교하는 것을 확인할 수 있다.
```java
private void acquire() {
    long threadId = Thread.currentThread().getId();
    if (threadId != this.currentThread.get() && !this.currentThread.compareAndSet(-1L, threadId)) {
        throw new ConcurrentModificationException("KafkaConsumer is not safe for multi-threaded access");
    } else {
        this.refcount.incrementAndGet();
    }
}
```
