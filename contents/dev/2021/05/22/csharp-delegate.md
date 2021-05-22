```java
using System;
using System.Threading;
					
public class Program
{
  public static int DoWork(int type) {
		Console.WriteLine("DoWork Thread: " + Thread.CurrentThread.ManagedThreadId);
		Thread.Sleep(1000);
		
		if (type == 1) {
			Console.WriteLine("Hello World");
			return type;
		} else {
			Console.WriteLine("Error World");
			throw new Exception("Error World");
		}
	}
	
	public delegate int DoWorkDelegate(int type);
	
	public static void Main()
	{
		Console.WriteLine("Matin Thread: " + Thread.CurrentThread.ManagedThreadId);
		
		DoWorkDelegate m = new DoWorkDelegate(DoWork);
		//m(1);
		//m.Invoke(1);
		
		//IAsyncResult ar = m.BeginInvoke(2, null, null);
		//m.EndInvoke(ar);
		
		AsyncCallback ac = new AsyncCallback(DoWorkCallback);
		IAsyncResult ar = m.BeginInvoke(1, ac, m);
		
		ar.AsyncWaitHandle.WaitOne();
	}
	
	public static void DoWorkCallback(IAsyncResult ar)
	{
		Console.WriteLine("Callback Thread: " + Thread.CurrentThread.ManagedThreadId);
		
		DoWorkDelegate m = ar.AsyncState as DoWorkDelegate;
		m.EndInvoke(ar);
	}
}
```
