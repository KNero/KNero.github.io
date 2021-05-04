주키퍼와 카프카를 설치하고 클라이언트에서 접속해 보기 전에 카프카를 편하게 관리하기 위해서 Web Admin 을 설치해 보겠다.
오픈소스 중에서 가장 최근까지 관리가 되는 것을 찾아보다 보니 `kafdrop` 을 찾을 수 있었다. (https://github.com/obsidiandynamics/kafdrop)

README의 사용법 중에서 jar 를 사용하는 방법을 사용할 것이고 빌드를 위해서 압축파일을 다운 받았다. 압축을 풀고 IntelliJ 를 통해 프로젝트를 열어보자.
(처음에는 빌드를 하지 않기 때문에 `target` 폴더는 보이지 않는다.)

jar 를 생성하기 전에 정상적으로 빌드가 되는 지 꼭 확인해 보자(JDK11+)
메이븐으로 jar 를 생성해야 하기 때문에 Maven Project 창을 열어보자.
Maven Project 창에서 상위에 있는 아이콘 중에 `Execute Maven Goal` 을 클릭하면 입력창이 나오는데 여기에 `clean package` 라고 입력하고 *Execute*를 실행하면 `target` 폴더가 생성되면서 target 폴더 안에서 jar 파일을 확인할 수 있다. *kafdrop-3.28.0-SNAPSHOT.jar* 이 파일로 이제 실행을 해보자.

실행을 위해서 kafdrop 폴더를 만들고 jar 파일을 복사해 온 후 `start.bat` 파일을 생성해 주었다.
```
start.bat 내용
java --add-opens=java.base/sun.nio.ch=ALL-UNNAMED -jar kafdrop-3.28.0-SNAPSHOT.jar --kafka.brokerConnect=localhost:9001,localhost:9002,localhost:9003 --server.port=9090 --management.server.port=9090
```
위 내용은 `https://github.com/obsidiandynamics/kafdrop#running-from-jar` 에서 확인할 수 있다.

실행하고 http://localhost:9090 으로 접속하게 되면 화면을 볼 수 있는데 나는 브로커를 3개를 올렸지만 이상하게 Brokers 에 하나만 보였다.
원인은 내가 무작정 카프카 설정을 따라서 하다보니 3대의 카프카가 주키퍼에 다른 공간을 사용하고 있어서 클러스터가 아닌 별도로 인식이 된것이었다.
```
# D:\kafka\kafka_2.13-2.8.0-1\config\server.properties
zookeeper.connect=localhost:2181,localhost:2182,localhost:2183/kafka01_znode
```
```
# D:\kafka\kafka_2.13-2.8.0-2\config\server.properties
zookeeper.connect=localhost:2181,localhost:2182,localhost:2183/kafka02_znode
```
```
# D:\kafka\kafka_2.13-2.8.0-3\config\server.properties
zookeeper.connect=localhost:2181,localhost:2182,localhost:2183/kafka03_znode
```
위가 기존 설정인데 맨 마지막에 `kafka0x_znode` 이 부분을 모두 같게 설정해야지 클러스터링으로 묶이게 된다.(ip:port 만 설정하면 주키퍼의 root(`/`) 를 사용하게 되는데 관리상 좋지 않기 때문에 지정해 주는 것이 좋다.)
나는 모두 `kafka01_znode` 로 설정해주고 재기동을 해주니 어드민에서 모든 노드가 보이게 되었다. 

그리고 어드민에서만 토픽을 생성할 수 있고  클라이언트요청에 의해서 자동으로 토픽이 생성되는 것을 막기위해
`auto.create.topics.enable=false` 도 추가해 주었다.
