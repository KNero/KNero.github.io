이제 web admin 을 사용하여 토픽을 생성하는 것을 시작으로 카프카를 사용해 보도록 하자. 토픽을 생성하기 위해서 맨 하단의 Topics 밑의 **New** 버튼을 클릭하면 토픽생성화면으로 이동하게 된다.
![토픽생성이미지]()

파티션 개수 경우 늘어난 파티션을 줄일 수 없고 필요할 경우 늘리는 것은 가능하기 때문에 1로 설정했다. 그리고 복제 개수는 브로커 개수만큼 자동으로 설정돼서 보이는데 기본 설정인 3을 사용했다. 토픽 이름을 입력하고 **Create** 버튼을 누르면 메인화면에서 생성결과를 확인할 수 있다.
![토픽정보메인화면]()

Overview 에서도 토픽의 개수를 확인할 수 있고 Brokers 에서도 2번 브로커에파티션이 1개 보이는데 파티션이 3개로 복제되기는 하지만 파티션에 리더는 하나이므로 리더가 있는 브로커에 1개로 표시되게 된다.

Topics 에서 **test-topic-1**을 클릭하여 토픽의 세부정보를 확인해 보자.
![토픽세부정보]()
여기서 리더노드와 복제정보, 오프셋 등을 확인할 수 있고 토픽삭제도 가능하다. 그리고 **View Message**라는 버튼이 있는데 누르면 토픽의 메시지를 확인할 수 있는 화면으로 이동하게 되는데 여기서 큐의 메시지를 볼 수 있지 않을 까 생각이 들지만 나중에 사용해봐야 겠다. (토픽 상세 페이지에서 **Partition Detail** 의 **Partition**의 숫자를 클릭해도 메시지 확인 화면으로 이동한다.)

이제 자바코드로 토픽에 값을 저장해 보자. **maven** 프로젝트를 만들고 디펜던시를 추가해주자.
```
<dependency>
    <groupId>org.apache.kafka</groupId>
    <artifactId>kafka-clients</artifactId>
    <version>2.8.0</version>
</dependency>
```
그리고 간단하게 Producer 코드를 작성해 준다.
```
코드
```
Producer 는 어느 파티션으로 메시지를 보낼 수 있는 지 지정할 수 있으나
나는 파티션을 하나만 사용하고 있기 때문에 따로 설정하지 않았다.
실행을 하고 kafka web admin 의 topic 상세 페이지로 가보면 size, offset 이 늘어난 것을 확인할 수 있다.
![토픽상세페이지]()
그리고 **View Message** 버튼을 눌러서 메시지를 확인할 수 있는 페이지로 이동해보자.
한 건의 데이터를 저장했기 때문에 `offset 0` 으로 검색을 해보자. Click View Message.
![메시지찾기이미지]()
key, value 값을 바로 확인해 볼 수 있다. 이 기능은 테스트 단계에서는 아주 유용할 것 같다.

### 키값을 지정하지 않고 저장
```
ProducerRecord<String, String> producerRecord = new ProducerRecord<>(topicId, value);
```
자동으로 생성되지는 않고 key 값이 빈 값으로 저장되는 것을 확인할 수 있다.(2 번째 메시지)
![메시지 2개 ]()

### 헤더를 추가하여 전송
```
ProducerRecord<String, String> producerRecord = new ProducerRecord<>(topicId, key, value);
        producerRecord.headers().add(new RecordHeader("name", "ksm".getBytes()));
        producerRecord.headers().add(new RecordHeader("where", "home".getBytes()));
```
맨 밑의 메시지를 보면 header 부분에 name, where 가 추가된 것을 볼 수 있다.
![헤더메시지]()

https://jhleed.tistory.com/180#:~:text=%EC%BB%A8%EC%8A%88%EB%A8%B8%20%EA%B7%B8%EB%A3%B9(Consumer%20Group)%20%EC%9D%B4%EB%9E%80,%EB%AC%B6%EB%8A%94%20%EB%85%BC%EB%A6%AC%EC%A0%81%20%EA%B7%B8%EB%A3%B9%20%EB%8B%A8%EC%9C%84%EC%9D%B4%EB%8B%A4.
