카프카를 사용하기에 앞서 주키퍼를 먼저 설치해 보려고 한다.
이번 2.8.0 에서는 주키퍼가 없는 카프카를 사용할 수 있다고 해서 카프카를 사용해 보려고 했는데 확인해 보니 정식이 아닌 맛보기(?) 정도로 사용하는 것이고
많은 불안한 요소가 있다고 알려주고 있다.

주키퍼를 사용하지 않고 카프카를 사용하는 것을 kraft 모드라고 부르는데 다른 설정파일을 사용하여 실행하면 된다. 설정파일 위치는 `kafka_2.13-2.8.0\config\kraft` 에 별도로 저장돼 있으며 실행할 때 `bin/kafka-server-start.bat config/kraft/server.properties` 이렇게 해주면 된다고 한다.
하지만 kraft폴더의 README.md 파일을 보고 난 다음 (거의 경고문 수준인거 같아서 ) 안정화가 되면 시도해 보기로 했다.

데스크탑에서 사용해보는 것이므로 카프카 폴더를 복사하여 카프카용 주키퍼를 만들었다. 카프카를 다운 받은 후에 압축을 푼 다음 config 안의 zookeeper.properties 는 standalone 모드이기 때문에 그냥 실행을 하면 잘 동작하지만 multi node 를 구성하기 위해서는 설정파일에 없는 설정을 추가해 줘야 한다. (당연히 주석으로 돼있을 꺼라 생각했지만 완전히 없었다.)

기본설정
```
# the directory where the snapshot is stored.
dataDir=/tmp/zookeeper
# the port at which the clients will connect
clientPort=2181
# disable the per-ip limit on the number of connections since this is a non-production config
maxClientCnxns=0
# Disable the adminserver by default to avoid port conflicts.
# Set the port to something non-conflicting if choosing to enable this
admin.enableServer=false
# admin.serverPort=8080
```

일단 `admin.enableServer=true` 수정하고 `admin.serverPort` 주석을 풀면 어드민 페이지에 접속할 수 있을 꺼라 생각했지만 `http://localhost:8080` 에는 접속할 수 없고 찾아보니 `http://localhost:8080/commands` 로 접속해야만 했다.
(나중에 주키퍼 관리 UI 를 찾아서 사용해 볼 예정이다.)

멀티 노드를 사용하기 위해 우선 접속하는 타임아웃 설정을 주자.
```
# 주키퍼가 사용하는 시간에 대한 기본 측정 단위(밀리초)
tickTime=1000
# 팔로워가 리더와 초기에 연결하는 시간에 대한 타임아웃 tick의 수
initLimit=5
# 팔로워가 리더와 동기화 하는 시간에 대한 타임아웃 tick의 수
syncLimit=10
```
`tickTime` 은 내가단위를 설정하는 부분인데 나는 1000ms=1s 로 설정했다.
`tickTime` 을 초로 했기 때문에 `initLimit`에 5를 설정하면 5초가 된다. 그리고 `syncLimit` 는 10초를 설정했다.

다음으로는 주키퍼 노드들의 정보를 입력해 줘야한다.
```
server.1=localhost:2881:3881
server.2=localhost:2882:3882
server.3=localhost:2883:3883
```
`server.myid=ip:리더연결port:리더선출port` 이렇게 구성되며 `myid` 는 밑에서 설명하고 첫 번째 포트를 통해서 리더에 연결하며 두 번째 포트를 통해서 리더를 선출하게 된다.
나는 데스크탑에서 3대를 모두 실행하다보니 IP가 아닌 포트를 다르게 설정해 주었다.

이제 myid 를 설정해 줘야 하는데 기본 설정 중 `dataDir` 이라는 설정이 있는데 이것은 현재 주키퍼가 모든 데이터를 저장하는 폴더로 이 폴더 바로 밑에 `myid` 라는 이름의 파일을 생성하고 서버 숫자를 저장해 줘야한다.
(파일 안에는 꼭 숫자하나만 저장되어야 한다.)
이 저장된 숫자가 위 설정에서 `server.myid` 이 부분에 사용되며 만약 `2`라고 저장했을 경우 `server.2=localhost:2882:3882` 이 설정이 자신의 것으라고 인식하고 `2882, 3883` 포트를 사용하게 된다.

이제 주키퍼 실행을 하면 되는데 편의를 위해서 설치폴더 밑에 (bin 폴더와 같은 위치) `start.bat` 파일을 만들었다. (파일 내용)
```
set KAFKA_LOG4J_OPTS=-Dlog4j.configuration=file:D:/kafka/zookeeper-kafka_2.13-2.8.0-1/config/log4j.properties

bin\windows\zookeeper-server-start.bat config\zookeeper.properties
```

이제 실행하게 되면 다른 노드들을 연결할 수 없다는 에러로그가 주시적으로 출력되는데 나머지 2개 노드를 실행해 주면 더이상 에러가 발생하지 않는다.

1번 노드 설정
```
# the directory where the snapshot is stored.
dataDir=D:/kafka/zookeeper-kafka_2.13-2.8.0-1/data
# the port at which the clients will connect
clientPort=2181
# disable the per-ip limit on the number of connections since this is a non-production config
maxClientCnxns=0
# Disable the adminserver by default to avoid port conflicts.
# Set the port to something non-conflicting if choosing to enable this
# http://localhost:9090/commands
admin.enableServer=true
admin.serverPort=9091

server.1=localhost:2881:3881
server.2=localhost:2882:3882
server.3=localhost:2883:3883

# 주키퍼가 사용하는 시간에 대한 기본 측정 단위(밀리초)
tickTime=1000
# 팔로워가 리더와 초기에 연결하는 시간에 대한 타임아웃 tick의 수
initLimit=5
# 팔로워가 리더와 동기화 하는 시간에 대한 타임아웃 tick의 수
syncLimit=10
```
2번 노드 설정
```
# the directory where the snapshot is stored.
dataDir=D:/kafka/zookeeper-kafka_2.13-2.8.0-2/data
# the port at which the clients will connect
clientPort=2182
# disable the per-ip limit on the number of connections since this is a non-production config
maxClientCnxns=0
# Disable the adminserver by default to avoid port conflicts.
# Set the port to something non-conflicting if choosing to enable this
# http://localhost:9090/commands
admin.enableServer=true
admin.serverPort=9092

server.1=localhost:2881:3881
server.2=localhost:2882:3882
server.3=localhost:2883:3883

# 주키퍼가 사용하는 시간에 대한 기본 측정 단위(밀리초)
tickTime=1000
# 팔로워가 리더와 초기에 연결하는 시간에 대한 타임아웃 tick의 수
initLimit=5
# 팔로워가 리더와 동기화 하는 시간에 대한 타임아웃 tick의 수
syncLimit=10
```

3번 노드 설정
```
# the directory where the snapshot is stored.
dataDir=D:/kafka/zookeeper-kafka_2.13-2.8.0-3/data
# the port at which the clients will connect
clientPort=2183
# disable the per-ip limit on the number of connections since this is a non-production config
maxClientCnxns=0
# Disable the adminserver by default to avoid port conflicts.
# Set the port to something non-conflicting if choosing to enable this
# http://localhost:9090/commands
admin.enableServer=true
admin.serverPort=9093

server.1=localhost:2881:3881
server.2=localhost:2882:3882
server.3=localhost:2883:3883

# 주키퍼가 사용하는 시간에 대한 기본 측정 단위(밀리초)
tickTime=1000
# 팔로워가 리더와 초기에 연결하는 시간에 대한 타임아웃 tick의 수
initLimit=5
# 팔로워가 리더와 동기화 하는 시간에 대한 타임아웃 tick의 수
syncLimit=10
```

주키퍼가이드: https://zookeeper.apache.org/doc/r3.1.2/zookeeperStarted.html
설정 정보 블로그: https://sungwookkang.com/1433
