# 객체공유

여러 스레드가 객체를 공유하는 환경에서 어떤 스레드가 값을 저장하면 또 다른 스레드에서는 저장된 값을 가져올 수 있다고 생각할 수 있지만 현실은 꼭 그렇지 않다.
예를 들어 아래와 같은 코드가 있다.

```java
public class Test {
	private isRun = true;

	public void stop() {
		isRun = false;
	}

	public void run() {
		while (isRun) {
			...
		}
	}	
}

```

어떤 스레드가 `run()`을 실행 중일 때 다른 스레드가 `stop()`을 외쳤을 경우 과연 그만할 수 있을까? (난 영원히 빠져나오지 못 했다...)
ThreadSafe 하지 않은 환경에서는 잘못된 값을 읽을 수 있을 뿐만 아니라 최신값을 읽는 것도 보장되지 않는다.

또한 코드는 재배치로 인해서 우리가 작성한 순서대로 실행되지 않을 수도 있다. 별다른 동기화 구조가 잡혀 있지 않다면 컴파일러는 직접 코드 실행 순서를 조절하며
하드웨어 레지스터에 데이터를 캐시하거나 CPU가 명령 실행 순서를 재배치하고 내부의 캐시에 데이터를 보관하는 등의 작업을 할 수 있다.

```java
// b가 먼저 실행될 수 있다.
int a = 1;
int b = 2;

// 무조건 순차적으로 실행된다.
int a = 1;
a = a + 1;
```

**그러므로 여러 스레드에서 공동으로 사용하는 변수에는 항상 적절한 동기화 기법을 적용해야한다.**

### volatile 변수

아주 유용하게 사용되는 키워드로 [stale data](http://www.terms.co.kr/staledata.htm)가 발생할 때 사용할 수 있는 volatile 이 있다.
volatile 은 해당 변수의 최신값을 읽어올 수 있게 해주며 약한 동기화라고 한다.
이 키워드를 사용하면 컴파일러와 런타임 모두 '변수를 공유하고, 실행 순서를 재배치해서는 안된다'고 이해한다.
그러므로 volatile 은 단일성은 보장되지 않지만 가시성은 보장될다.

나는 주로 아래와 같이 읽는 스레드는 다수이고 수정하는 스레드는 하나일 경우 `synchronized` 보다는 `volatile`을 사용한다.
```java
public class TestPool {
	private volatile isRun = true;

	public TestPool() {
		new Thread(() -> {
			while (isRun) {
				...
			}
		})
	}

	public void stop() {
		isRun = false;
	}
}
```

### 객체 공개와 유출

우리는 의도하지 않았지만 `private` 멤버변수를 외부에 노출하는 경우가 있다. `primitive` 타입일 경우에는 `public get`을 사용하더라도 멤버변수가 수정되지 않기 때문에 
괜찮지만 객체일 경우에는 `public get`을 사용해서 노출할 경우 멤버변수의 수정을 오픈하게 되고 여러 스레드가 접근하게 되어 의도하지 않게 값이 변경될 수 있다.
또한 `collection` 일 경우에는 내부의 모든 객체를 노출하게 된다.

```java
	public List<Test> getTest() {
		return this.testList; // 완전히 노출되었다. 안전하지 않다.
	}
```

책의 예제에서 아래 코드는 왜 this 클래스에 대한 참조를 외부에 공개하는 상황이라는 걸까
```java
public class ThisEscape {
	public ThisEscape(EventSource source) {
		source.registerListener(
			new EventListener() {
				public void onEvent(Event e) {
					doSomething(e);
				}
			}
		);
	}
}
```
위와 같이 사용하면 this 노출된다며 아래와 같이 사용하는 것이 좋다고 한다.
```java
public class SafeListener {
	private final EventListener listener;

	private SafeListener() {
		listener = new EventListener() {
			public void onEvent(Event e) {
				doSomething(e);
			}
		};
	}

	public static SafeListener newInstance(EventSource source) {
		SafeListener safe = new SafeListener();
		source.registerListener(safe.listener);
		return safe;
	}
}
```

### 스레드 한정

스레드 한정이랑 특정 객체를 여러 스레드가 사용하지만 사용하는 순간에는 오직 하나의 스레드만 사용하도록 하는 것이다.
이렇게 사용하는 순간에는 하나의 스레드만 접근하게 된다면 해당 객체는 동기화 처리를 하지 않더라도 자동으로 ThreadSafe하게 된다.

스레드 한정을 사용하는 사례는 DB Connection Pool을 생각할 수 있는데 Connection을 가져가는 부분만 동기화처리가 되어있다면
Connection 객체 자체는 동기화 처리를 하지 않아도 된다.

### 스택 한정

스택 한정은 스택에 할당되는 로컬 변수를 통해서 객체를 사용하는 것이다.
스택은 모든 스레드가 독립접으로 가지고 있는 공간으로 스택에 할당되는 로컬 변수를 사용하게 되면 동기화에 대한 걱정을 할 필요가 없게 된다.

### ThreadLocal

ThreadLocal 은 아주 유용한 클래스로 스레드만의 고유한 메모리를 할당 받는 것이라고 생각하면 된다.
스레드가 살아있는 동안 계속해서 참조할 수 있으며 필요할 때 어디에서나 사용할 수 있고 스레드가 소멸하게 되면 같이 사라진다.
예를 들어 요청이 들어왔을 때 필터에서 유저 정보를 저장해둔다면 요청을 처리하는 쓰레드는 어떤 메소드에서나 유저정보를 꺼낼 수 있다.

```java
public class Context {
    public static ThreadLocal<UserInfo> local = new ThreadLocal<UserInfo>();
}

Context.local.set(currentUser); // 필터에서 세팅해준다.

UserInfo userInfo = Context.local.get(); // 어떤 비지니스 로직에서나 가져올 수 있다.
```

### 불변성

객체를 안전하게 공개하는 방법으로는 바로 불변이 있다. `final`
처음부터 끝까지 수정할 수 없는 불변객체를 사용한다면 완전히 공개하더라도 ThreadSafe 하다.
물론 객체를 공개할 때 객체뿐만 아니라 멤버 변수도 모두 불변이어야 한다는 사실은 잊지말자.

```java
public class Test {
	private final List<String> list = new ArrayList<>();

	public List<String> getList() {
		return list; // 망했다.
	}
}
```