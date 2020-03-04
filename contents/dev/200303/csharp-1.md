# [C#] blocking / await 사용방법에 따른 속도 비교
# 

for 문안에서 IO 를 사용할 때 어떤 방법이 효율적인 지 알아보기 위해 세 가지방법을 비교해 보았다. 

1. 가장 기본적인 방법으로 싱글 스레드로 foreach 를 사용
2. 멀티 쓰레드를 사용 (Parallel)
3. await 을 사용한 비동기 처리

## 1. foreach
```c#
for (int i = 0; i < 1000; ++i)
{
	GetHtmlAsync().Wait(); // 1
	Console.WriteLine(i);
	Interlocked.Increament(ref completeCount); // 2
}
```
`1`에서 ```Wait()```을 사용해서 blocking 한다. `2` 은 다른 로직과 조건을 맞춰주기 위해서 추가했으며 아래 ```await```테스트에서 사용된다.
싱글 쓰레드의 ```foreach```는 가장 느리지만 가장 안정적이다. cpu 사용률도 낮고 장애를 생각하여 코드를 작성하기도 쉽다.
만약 배치를 통해서 적은 양의 데이터를 처리해야 하는 상황이라면 좋은 방법이다.

## 2. Parallel
```c#
Parallel.For(0, 1000, count => {
	GetHtmlAsynch().Wait(); // 1
	Console.WriteLine(count);
	Interlocked.Increment(ref completeCount); // 2
});
```
```Parallel class```는 멀티 쓰레드를 사용할 수 있으며 정해진 양을 순차적으로 처리하기 쉽게 해주고 
모든 쓰레드의 일이 종료되면 ```For()``` 다음 라인이 실행되기 때문에 제어도 쉽다.
비록 ```Wait()```에서 Blocking 되지만 멀티쓰레드를 사용하여 `foreach` 보다 속도를 올릴 수 있다.
물론 멀티쓰레드 환경이기 때문에 cpu 사용량을 고려해서 쓰레드 개수를 잘 조절해주는 것은 잊지 말아야한다.

## 3. await
```c#
public static void Await()
{
	for (int i = 0; i < 1000; ++i)
	{
		GetHtmlWaitAsync(); // 1
		Console.WriteLine(i);
	}

	while (completeCount < 1000) // 2
	{
		ThreadSleep(1);
	}
}

private static async void GetHtmlWaitAsync()
{
	var client = new HttpClient();

	var result = await client.GetStringAsync("https://wwww.dotnetfoundation.org");
	if (string.IsNullOrEmpty(result))
	{
		Console.WriteLine("=====> Fail!");
	}
	else
	{
		Interlocked.Increment(ref completeCount);
	}
}
```
싱글 쓰레드 환경에서 멀티쓰레드보다 속도를 올리 수 있는 방법이 ```await``` 이다. ```await```을 만나면 쓰레드는 다음을 실행하지 않고
해당 메소드를 빠져나오며 이후에 ```await```의 결과가 반환되면 그 신호를 받아 하던 일을 잠시 멈추고 결과를 처리한다.
쓰레드가 Blocking 없이 계속 일하기 때문에 속도가 빠르지만 cpu 의 사용양도 많이 늘어나게 된다.
`1`에서는 ```GetHtmlWaitAsync()``` 안의 ```await``` 부분에서 바로 종료되며 for문이 수행되고 ```GetStringAsync```의 결과가 오면
```GetHtmlWaitAsync()``` 안의 ```await``` 다음을 수행하게 된다. 
`2`에서는 아직 ```await``` 응답을 받지 못했을 수 있기 때문에 응답을 정상적으로 수신해서 ```Interlocked.Increment(ref completeCount)``` 를 통해 카운트가 1000이 될 때 까지 기다린다.

`await`, `async` 는 사용방법이 조금은 어렵지만 적절한 부분에 사용한다면 효율적인 서버개발을 할 수 있다.
참고: [마이크로소프트 doc](https://docs.microsoft.com/ko-kr/dotnet/csharp/programming-guide/concepts/async/task-asynchronous-programming-model#BKMK_AsyncandAwait)
