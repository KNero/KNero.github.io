현재 카프카를 윈도우에서 cmd를 띄어놓고 테스트를 하고 있는데 테스트를 하기 위해서 접속해서 확인해 보니 아래와같은 에러가 발생하며 카프카 노드 3개가 모두 정지돼 있었다.

![error](/contents/dev/2021/05/17/image/error-1.png)

해결 방법을 찾아보니 **server.properties** 의 설정 중 `log.dirs` 에 설정한 폴더 안의 모든 폴더와 파일을 삭제하고 시작해야 한다고 한다(심각..)

![folder](/contents/dev/2021/05/17/image/datafolder.png)

`__consumer_offsets-49`이런 consumer offsets 폴더만 50개, 생성한 토픽 정보가 있는 폴더, 그 외에 정보들이 저장된 파일이 있는데 삭제를 해도 될까 싶지만 
삭제하는 방법 외에 해결 방법을 찾지 못 해서 일단 삭제를 하고 재시작해 보았다.

다행인지 아닌지 일단 정상적으로 동작은 했고 모든 기본 정보들은 주키퍼에 저장되어 있어서 잘 복구가 되었지만 모든 토픽의 offset 정보뿐 아니라 데이터 관련 정보들이 초기화 되어 있었다.

**삭제전**

![origin](/contents/dev/2021/05/07/image/consumer-3.png)

**삭제후**

![offset-0](/contents/dev/2021/05/17/image/reset.png)

만약 3대 중에 1대라도 살아있었다면 모든 정보가 복구되지 않을까 싶어서 하나만 두고 나머지 2개 노드를 모두 내려서 data 폴더를 삭제한 뒤 다시 올려보았다.

테스트를 위해서 새로운 데이터를 저장하고 consumer 로 꺼내서 offset 도 증가시켰다.

![test-1](/contents/dev/2021/05/17/image/test-1.png)

그리고 2개 노드를 정지하고 `log.dirs` 폴더의 내부를 모두 삭제하고 다시 실행해 보았다.

![test-2](/contents/dev/2021/05/17/image/test-2.png)

리더노드가 변경된 점을 제외하고는 모두 그대로 복구된 것을 알 수 있다.
노드가 1개라도 살아 있다면 모든 정보들은 복구할 수 있지만 중요한 점은 3개 노드가 모두 내려가 있었다는 점이다.
이 에러로 인해서 카프카는 윈도우 말고 우분투와 같은 리눅스 환경에서 실행하는 게 좋다고 한다.