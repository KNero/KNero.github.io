# C# 확장 메소드

C#에서는 확장 메소드라는 기능을 제공해 준다. 이 기능은 메소드를 추가할 때 상속을 받거나 해당 메소드를 수정하지 않고 메소드를 추가하는 좋은 방법을 제공해 준다.
만약 `string`에서 `' ', '.', '?'` 를 제외한 문자를 카운트 하는 메소드가 필요하다면 아래와 같이 정적 메소드를 구현해 준다.

```c#
namespace ExtensionMethods
{
    public static class MyExtensions
    {
        public static int WordCount(this String str)
        {
        	if (string.IsNullOrWhiteSpace(str)) 
        	{
        		return 0;
        	}

            return str.Split(new char[] { ' ', '.', '?' }, 
            	StringSplitOptions.RemoveEmptyEntries).Length;
        }
    }   
}
```

그리고 필요한 곳에서는 기존 `string`의 인스턴스에서 호출할 수 있다.

```c#
string s = "Hello Extension Methods";  
int i = s.WordCount();  
```

확장 메서드의 첫 번째 매개 변수는 메소드가 작동하는 형식을 지정하며 매개 변수 앞에 `this` 한정자가 있다. 그리고 `static class`의 `static method`로 정의되어야 한다.

이 기능이 재미있는 점 중에 하나는 `static` 메소드인 점이다. 만약 인스턴스가 `null`인 경우에도 상단의 확장 메소드처럼 null을 검사한다면 문제없이 호출할 수 있다.
(null을 검사하는 `string.IsNullOrWhiteSpace` 가 있다.)

```c#
string s = null;  
int i = s.WordCount(); // 0 출력
```

확장 메소드는 아주 좋은 기능이지만 실무에서 메소드가 확장인지 아닌지 모를 경우 조금은 헤맬수 있다.
내가 그랬었는데 코드를 읽다가 인턴스가 null 인데 어떻게 실행되지 라고 생각하며 한참을 원인을 찾다가 F12를 눌러 구현체로 가보니 확장 메소드였다.. :(

[확장 메소드 Microsoft Doc](https://docs.microsoft.com/ko-kr/dotnet/csharp/programming-guide/classes-and-structs/extension-methods)