# Event & Delegate

C# 에는 Delegate 와 Event 가 있다. 처음 둘을 접했을 때는 둘의 차이가 애매한 부분이 있었다.
지금까지 어떤 처리를 해야할 경우 처리 로직을 위임하는 방법으로 Delegate 를 사용했는데 Event 또한 이벤트가 발생했을 때 처리를 할 수 있도록 해주기 때문이다.
말하면서도 뭔가 차이가 있는 듯 하지만 없는 듯 해서 C# 에서는 어떤 차이를 두고 구현을 했는지 확인을 해 보았다.

우선 `delegate`를 만들어 보자

```
namespace Test
{
    public delegate void TestDelegate(string a);

    public class Program
    {
        public static void Main(string[] args)
        {

        }
    }
}
```

C#에서는 `delegate`를 통해서 method의 참조를 method 의 paramter 로 넘길 수 있는데 이것은 java 의 `lambda(하나의 구현되지 않은 method를 가지고 있는 interface)`와 사용방법이 같다.
그리고 이제 event를 만들려고 하니 그냥 만들수는 없고 `delegate`를 사용하여만 한다고 한다. 이것으로 `event`는 `delegate`로만 만들어야 한다는 사실을 알았다.

```
namespace Test
{
    public delegate void TestDelegate(string a);

    public class Program
    {
    	public event TestDelegate TestEvent;

        public static void Main(string[] args)
        {

        }
    }
}
```

그리고 `delegate`는 `class`와 같은 레벨인 `namespace`에 만들 수 있지만 `event`는 `class`안으로 들어가야 한다.
테스트를 위해서 `TestDelegate` 메소드를 추가해 보겠다.

```
using System;

namespace Test
{
    public delegate void TestDelegate(string a);

    public class Program
    {
    	public event TestDelegate TestEvent;

        public static void Main(string[] args)
        {

        }

        public static void TestDelegate1(string a)  // <- 추가
        {
            Console.WriteLine("TestDelegate1: " + a);
        }

        public static void TestDelegate2(string a)  // <- 추가
        {
            Console.WriteLine("TestDelegate2: " + a);
        }
    }
}
```

`delegate`의 사용법은 알고 있으니 `event` 를 사용해 보자.

```
using System;

namespace Test
{
    public delegate void TestDelegate(string a);

    public class Program
    {
    	public event TestDelegate TestEvent;

        public static void Main(string[] args)
        {
			Program p = new Program();
            p.TestEvent = TestDelegate1;
            p.TestEvent += TestDelegate2;
            p.TestEvent("test"); 
        }
		
		public static void TestDelegate1(string a)
        {
            Console.WriteLine("TestDelegate1: " + a);
        }
        public static void TestDelegate2(string a)
        {
            Console.WriteLine("TestDelegate2: " + a);
        }
    }
}
```

`delegate` 와는 다르게 `event`는 `add(+=)`, `remove(-=)` 기능을 통해서 `delegate` 를 추가및 삭제를 할 수 있었다.
이로써 `event`는 이벤트가 발생했을 때 그 이벤트를 처리하는 여러 개의 `delegate` 묶음이라는 것을 알 수 있다. (`delegate`가 순차적으로 실행)

`add`, `remove` 기능이 있다면 이것을 재정의할 수 있을까?

```
public event TestDelegate TestEvent
{
	add
	{
		...
	}
	remove
	{
		...
	}
}
```

물론 가능하다. 히지만 대입(=)과 호출을 사용할 수 없게 된다.

```
p.TestEvent = TestDelegate1; // compile error
...
p.TestEvent("test"); // compile error
```

오직 `add`, `remove`만 가능한데 이렇게 되면 다른 `event`의 추가/삭제를 도울 수 있는다.(추가/삭제 처리를 위한 부가적인 로직도 구현 가능하다.)

이 방법은 실제 수행하는 `event`는 노출하지 않고 `delegate` 를 등록/삭제하는 방법(interface)만 노출할 수 있다는 장점이 있다.