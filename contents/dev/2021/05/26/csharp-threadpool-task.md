## 1. ThreadPool

`ThreadPool` 에서는 `QueueUserWorkItem` 메소드를 통해서 원하는 작업을 전달 할 수 있다. `ThreadPool` 에서 동작하는 Thread 는 **background thread** 로
실행되고 있는 foreground thread 가 없을 경우 강제로 종료된다.

```c#
using System;
using System.Threading;

namespace Test3
{
    class Program
    {
        static void Main(string[] args)
        {
            Console.WriteLine("Current Thread: {0}", Thread.CurrentThread.ManagedThreadId);

            ThreadPool.QueueUserWorkItem(new WaitCallback(DoWork));

            Console.WriteLine("Is Background Thread: {0}", Thread.CurrentThread.IsBackground);
        }

        private static void DoWork(object state)
        {
            Console.WriteLine("Current Thread: {0}", Thread.CurrentThread.ManagedThreadId); // 출력되지 않을 수 있다.
            Console.WriteLine("Is Background Thread: {0}", Thread.CurrentThread.IsBackground); // 출력되지 않을 수 있다.
        }
    }
}
```
**실행결과**
```text
Current Thread: 1
Is Background Thread: False
Current Thread: 4
Is Background Thread: True
```
```text
Current Thread: 1
Is Background Thread: False
```

## 2. Task

`class Task` 에 의해서 실행되는 경우 `ThreadPool` 과 동일하게 **background** 로 실행되며 foreground thread 가 없을 경우 종료되게 된다.

```c#
using System;
using System.Threading.Tasks;

namespace Test3
{
    class Program
    {
        static void Main(string[] args)
        {
            Task t1 = new Task(() => { Console.WriteLine("Task One"); });
            t1.Start();

            t1.Wait();
        }
    }
}
```

`Task`는 이어서 실행할 새로운 `Task` 를 만들 수 있다.
```c#
static void Main(string[] args)
{
	Task t1 = new Task(() => { Console.WriteLine("Task One"); });
	Task t2 = t1.ContinueWith((task) => {
		Console.WriteLine("Param: " + task.Id); // t1 이 전달된다.
		Console.WriteLine("Task Continued"); 
	});
	Console.WriteLine("t1: " + t1.Id);
	Console.WriteLine("t2: " + t2.Id);
	t1.Start();

	t1.Wait();
	t2.Wait(); // t2는 별도의 Task 로 기다리지 않으면 실행되지 않을 수 있다.
}
```

**결과**
```text
t1: 2
t2: 1
Task One
Param: 2
Task Continued
```

전체 `Task`를 기다리기 위해서 아래와 같은 방법을 사용할 수 있다.
```c#
Task.WaitAll(t1, t2);
```

그리고 실행하는 방법으로 `Run`도 있다.
```c#
Task.Run(() => { Console.WriteLine("Task Run"); }).Wait();
```
