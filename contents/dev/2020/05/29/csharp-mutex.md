# 프로세스 동기화 하기

쓰레드 단위가 아닌 프로세스 단위의 동기화를 사용해야 하는 경우가 있는데 이때 필요한 class 가 `Mutex` 이다.
나는 하나의 파일을 다른 프로세스가 접근하기 위해서 이 기능을 사용했다.

사용법은 간단하다.

```
Mutex mutex = new Mutext(false, "mutex_name");
```

이렇게 사용하면 같은 `mutex_name`을 사용하는 프로세스의 쓰레드는 동기화 처리가 된다.
**여기서 기본 생성자(`new Mutex()`)를 사용하게 되면 프로세스 단위가 아닌 쓰레드 단위의 동기화처리가 된다.**

그리고 첫 번째 인자는 초기 소유권을 가져야 할지 여부라고 하는데 true로 할 경우 처음 Mutex 소유한 프로세스에서는 아무 문제가 없었지만
두 번째로 소유한 프로세스는 `AbandonedMutexException` 를 항상 발생시켰고 그래서 false 로 설정해 주었다.

```
using System;
using System.Threading;

class Example
{
    // Create a new Mutex. The creating thread does not own the mutex.
    private static Mutex mut = new Mutex();
    private const int numIterations = 1;
    private const int numThreads = 3;

    static void Main()
    {
        // Create the threads that will use the protected resource.
        for(int i = 0; i < numThreads; i++)
        {
            Thread newThread = new Thread(new ThreadStart(ThreadProc));
            newThread.Name = String.Format("Thread{0}", i + 1);
            newThread.Start();
        }

        // The main thread exits, but the application continues to
        // run until all foreground threads have exited.
    }

    private static void ThreadProc()
    {
        for(int i = 0; i < numIterations; i++)
        {
            UseResource();
        }
    }

    // This method represents a resource that must be synchronized
    // so that only one thread at a time can enter.
    private static void UseResource()
    {
        // Wait until it is safe to enter.
        Console.WriteLine("{0} is requesting the mutex", 
                          Thread.CurrentThread.Name);
        mut.WaitOne();

        Console.WriteLine("{0} has entered the protected area", 
                          Thread.CurrentThread.Name);

        // Place code to access non-reentrant resources here.

        // Simulate some work.
        Thread.Sleep(500);

        Console.WriteLine("{0} is leaving the protected area", 
            Thread.CurrentThread.Name);

        // Release the Mutex.
        mut.ReleaseMutex();
        Console.WriteLine("{0} has released the mutex", 
            Thread.CurrentThread.Name);
    }
}
// The example displays output like the following:
//       Thread1 is requesting the mutex
//       Thread2 is requesting the mutex
//       Thread1 has entered the protected area
//       Thread3 is requesting the mutex
//       Thread1 is leaving the protected area
//       Thread1 has released the mutex
//       Thread3 has entered the protected area
//       Thread3 is leaving the protected area
//       Thread3 has released the mutex
//       Thread2 has entered the protected area
//       Thread2 is leaving the protected area
//       Thread2 has released the mutex
```

Microsoft 에 있는 예제인데 `mutex.waitOne()`으로 기다리고 사용한 후 `mutex.ReleaseMutex()` 로 반납하는 것을 알 수 있다.
`waitOne`을 사용할 때는 timeout를 사용해 주는 것이 좋다.

[Microosft Mutex](https://docs.microsoft.com/ko-kr/dotnet/api/system.threading.mutex?view=netframework-4.6.2)
