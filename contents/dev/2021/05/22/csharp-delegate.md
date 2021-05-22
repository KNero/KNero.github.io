C# 에서는 비동기 호출을 하는 방법으로 `delegate`가 있다.
```c#
public delegate int DoWorkDelegate(int type);
```
그리고 이 `delegate`의 묶음을 `event` 라고 한다. (참고: [Event & Delegate](https://knero.github.io/#/contents?path=/contents/dev/2020/05/11/csharp-event-delegate.md&f=[C#]))
이제 `delegate`에 대해서 알아보자.

테스트 준비를 위해 `delegate`인 `DoWorkDelegate`를 만들고 이 `delegate` 에 전달할 메소드인 `DoWork` 를 만든다. (return 과 parameter 가 같아야 한다.)
그리고 `Main` 에 `delegate`를 생성한다.
```c#
using System;
using System.Threading;

public class Program
{
	public delegate int DoWorkDelegate(int type);
	
	public static int DoWork(int type) {
		Console.WriteLine("DoWork Thread: " + Thread.CurrentThread.ManagedThreadId); // 같은 thead 에서 동작하는 지 확인
		Thread.Sleep(1000); // 비동기 호출이 main thread 보다 오래 걸리도록 강제 sleep
		
		// type에 따라서 예외를 발생시켜 비동기에서 예외를 catch 할 수 있는 지 테스트
		if (type == 1) {
			Console.WriteLine("Hello World");
			return type;
		} else {
			Console.WriteLine("Error World");
			throw new Exception("Error World");
		}
	}
	
	public static void Main()
	{
		Console.WriteLine("Matin Thread: " + Thread.CurrentThread.ManagedThreadId); // 같은 thead 에서 동작하는 지 확인
		
		DoWorkDelegate m = new DoWorkDelegate(DoWork);
	}
}
```

## 동기 호출
동기호출은 간단하게

```c#
m(1);
```

이렇게 괄호를 붙이는 것으로도 가능하고

```c#
m.Invoke(1);
```

`Invoke`메소드를 통해서 사용 가능하고 실행하면 아래와 같이 결과를 확인할 수 있다.

```text
Matin Thread: 81
DoWork Thread: 81
Hello World
```

동기로 호출이 됐기 때문에 `DoWork`도 같은 thread 에서 실행되는 것을 확인할 수 있고 `type`을 2로 전달해서 예외도 받을 수 있다.

```c#
m(2);
m.Invoke(2);
```

```text
Matin Thread: 71
DoWork Thread: 71
Error World
Run-time exception (line 15): Error World

Stack Trace:

[System.Exception: Error World]
   at Program.DoWork(Int32 type) :line 15
   at Program.Main() :line 27
```

## 비동기 호출

비동기 호출은 `BeginInvoke`, `EndInvoke`를 사용하면 된다.

```c#
IAsyncResult ar = m.BeginInvoke(1, null, null);
int a = m.EndInvoke(ar);

Console.WriteLine("return: " + a);
```

`BeginInvoke`의 첫 번째 parameter 는 `DoWork` 의 parameter 인 **type** 이고 두 번째는 `AsyncCallback`, 세 번째는 비동기 호출에 전달하고 싶은 객체를 넣어주면 되는데
우선 2, 3번째 parameter 를 사용하지 않을 것이므로 `null` 로 전달하고 첫 번째만 1을 전달해보자.

`EndInvoke`에 `BeginInvoke`가 반환한 `IAsyncResult`를 전달하게되면 `EndInvoke` 에서는 전달된 결과를 통해서 반환값을 주거나 예외가 발생했다면 예외를 발생시켜준다.

**결과**

```text
Matin Thread: 684
DoWork Thread: 87
Hello World
return: 1
```

결과를 보면 동작한 thread 는 다르지만 결과를 받을 수 있고 `Sleep(1000)`로 지연을 시켰지만 `EndInvoke`에서 blocking 돼서 결과를 기다렸다는 것을 알 수 있다.
이렇게 사용하게 되면 동기호출과 같으므로 결과값 처리도 비동기로 할 수 있도록 callback 을 사용해 보자.

## Callback 을 사용한 비동기 호출

```c#
public static void Main()
{
	Console.WriteLine("Matin Thread: " + Thread.CurrentThread.ManagedThreadId);

	DoWorkDelegate m = new DoWorkDelegate(DoWork);
	
	AsyncCallback ac = new AsyncCallback(DoWorkCallback);
	IAsyncResult ar = m.BeginInvoke(1, ac, m);
}

public static void DoWorkCallback(IAsyncResult ar)
{
	Console.WriteLine("Callback Thread: " + Thread.CurrentThread.ManagedThreadId);

	DoWorkDelegate m = ar.AsyncState as DoWorkDelegate;
	m.EndInvoke(ar);
}
```

`DoWorkCallback`를 추가하고 `AsyncCallback`를 통해서 `BeginInvoke`에 전달해 주자. 그리고 마지막 parameter 로 `m`을 전달해서 호출한다. 
`DoWorkCallback`의 parameter 로 전달되는 `IAsyncResult`객체에서 `AsyncState`를 사용해서 `m`을 가져올 수 있고 `EndInvoke`를 호출하면 비동기 호출이 끝난다.

하지만 이 상태로 실행하면 `Sleep(1)` 이후의 `Hello World`로그가 출력되지 않는다. 이유는 비동기 호출을 실행하는 thread는 background로 실행되기 때문에
main thread 가 종료되면 강제로 종료되게 된다. 지금 로그를 출력하기 위해서는 `Main` 함수 맨 밑에 아래 코드를 추가해 줘야 한다.

```c#
ar.AsyncWaitHandle.WaitOne();
```

```text
Matin Thread: 40
DoWork Thread: 12
Hello World
Callback Thread: 12
```

실무에서의 서버에서는 main thread 가 종료되지 않기 때문에 비동기 호출 후 실행해야할 코드가 없다면 사용하지 않아도 된다.

## EndInvoke 의 예외처리

위에서 짧게 설명했지만 `EndInvoke`는 `BeingInvoke` 의 결과를 통해서 번환값과 예외처리를 도와준다. 즉, `EndInvoke` 를 통해서
비동기 호출이지만 동기호출과 같은 방법으로 반환값과 예외를 처리할 수 있는 것이다.

```c#
**예외처리**
```c#
IAsyncResult ar = m.BeginInvoke(2, null, null);
		
try 
{
	int a = m.EndInvoke(ar);

	Console.WriteLine("return: " + a);
}
catch (Exception e)
{
	Console.WriteLine(e);
}
```
```
