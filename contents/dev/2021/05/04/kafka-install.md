이번에는 카프카를 설치해 보도록 하자.
3~4년전 카프카를 처음 설치해서 사용했을 때는 내 실력도 낮고 버전도 0.x 이었기 때문에 뭔가 어려움이 많았다. 하지만 다시 설치해보니 그때 만큼은 어렵지 않게 느껴졌다.

우선 다운받은 2.8.0 버전의 카프카를 압출을 풀고 설정파일을 수정해 보자.
(나는 3대의 카프카를 실행할 것이기 때문에 각 3개의 설정을 적을 것이다.)

![kafka folder](/contents/dev/2021/05/04/image/kafka-install-1.png)

가장 위에 있는 설정인 `broker.id` 는 주키퍼의 `myid` 처럼 유니크한 숫자를 적어주면 된다.
```
파일: D:\kafka\kafka_2.13-2.8.0-1\config\server.properties
broker.id=1
```
```
파일: D:\kafka\kafka_2.13-2.8.0-2\config\server.properties
broker.id=2
```
```
파일: D:\kafka\kafka_2.13-2.8.0-3\config\server.properties
broker.id=3
```

각 카프카가 데스크탑에서 다른 포트로 동작해야 하기 때문에 포트를 다르게 설정해 준다.
```
파일: D:\kafka\kafka_2.13-2.8.0-1\config\server.properties
listeners=PLAINTEXT://localhost:9001
```
```
파일: D:\kafka\kafka_2.13-2.8.0-2\config\server.properties
listeners=PLAINTEXT://localhost:9002
```
```
파일: D:\kafka\kafka_2.13-2.8.0-3\config\server.properties
listeners=PLAINTEXT://localhost:9003
```

카프카의 로그폴더를 수정해 주자. 나는 주키퍼와 같은 형태로 **bin** 과 같은 위치에 data 폴더를 만들었다.
```
파일: D:\kafka\kafka_2.13-2.8.0-1\config\server.properties
log.dirs=D:/kafka/kafka_2.13-2.8.0-1/data
```
```
파일: D:\kafka\kafka_2.13-2.8.0-2\config\server.properties
log.dirs=D:/kafka/kafka_2.13-2.8.0-2/data
```
```
파일: D:\kafka\kafka_2.13-2.8.0-3\config\server.properties
log.dirs=D:/kafka/kafka_2.13-2.8.0-3/data
```

복제 개수를 설정한다. default 는 3이라고 하며 나도 3을 설정해 줬다.
```
파일: 3 파일 모두 동일
offsets.topic.replication.factor=3
```

주키퍼노드에 대한 정보를 적어준다. 주키퍼 3개의 정보와 znode 를 같이 설정해 준다.
```
파일: D:\kafka\kafka_2.13-2.8.0-1\config\server.properties
zookeeper.connect=localhost:2181,localhost:2182,localhost:2183/kafka01_znode
```
```
파일: D:\kafka\kafka_2.13-2.8.0-2\config\server.properties
zookeeper.connect=localhost:2181,localhost:2182,localhost:2183/kafka01_znode
```
```
파일: D:\kafka\kafka_2.13-2.8.0-3\config\server.properties
zookeeper.connect=localhost:2181,localhost:2182,localhost:2183/kafka01_znode
```
관련해서 다른 블로그에 아래와 같은 글이 있었다.
```
주키퍼 접속 정보다. 주키퍼 앙상블에 해당하는 호스트명:포트번호를 입력한다. 그런데 그냥 호스트명:포트번호만 입력하면, 여러 개의 카프카에서 주키퍼에 접근하여 지노드를 사용할 때 동일한 지노드를 사용하게 되어 충돌이 발생할 수 있으므로, 호스트명:포트번호 뒤에 지노드 이름을 추가로 입력해야 한다.
출처: https://twofootdog.tistory.com/90
```
여기서 **kafka01_znode** 부분을 다르게 입력하면 모두 다른 클러스터로 사용되기 때문에 같은 노드를 설정해 줘야한다.
그리고 만약 이 부분을 설정하지 않고 **localhost:2181,localhost:2182,localhost:2183** 만 사용한다면 주키퍼의 root(`/`) 를 사용하기 때문에 관리상 좋지 않다.
(카프카를 위한 웹 어드민을 설치하는 중 알게되었다.)

이렇게 하고 `bin` 과 같은 위치에 주키퍼와 똑같이 `start.bat` 를 만들었다.
```
파일: D:\kafka\kafka_2.13-2.8.0-1\start.bat
set KAFKA_LOG4J_OPTS=-Dlog4j.configuration=file:D:/kafka/kafka_2.13-2.8.0-1/config/log4j.properties

bin\windows\kafka-server-start.bat config\server.properties
```
```
파일: D:\kafka\kafka_2.13-2.8.0-2\start.bat
set KAFKA_LOG4J_OPTS=-Dlog4j.configuration=file:D:/kafka/kafka_2.13-2.8.0-2/config/log4j.properties

bin\windows\kafka-server-start.bat config\server.properties
```
```
파일: D:\kafka\kafka_2.13-2.8.0-3\start.bat
set KAFKA_LOG4J_OPTS=-Dlog4j.configuration=file:D:/kafka/kafka_2.13-2.8.0-3/config/log4j.properties

bin\windows\kafka-server-start.bat config\server.properties
```

이렇게 설정하고 차례로 실행하게 되면 모두 정상적으로 동작하게 된다.
