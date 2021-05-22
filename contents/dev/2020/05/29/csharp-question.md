# ? 와 ?? 사용법

C# 문법에는 아주 편리한 `?` 와 `??` 가 있다. 여기서 `?` 를 보고 아래와 같은 코드를 생각할 수 있다.

```c#
int num2 = num1 > 0 ? 1 : 2
```

하지만 이것이 아니라 더 유용하지만 몰랐던 문법이 있었다.

```c#
int? num1 = 0;
int? num2 = null;
```

이전에는 Java 개발자였던 나에게는 아주 생소했는데 `int` 변수형에 `null`이 대입된다는 것이 신기했다. 
그래서 아래처럼 `null` 검사가 가능하다.

```c#
int? b = null;

if (b == null)
{
	...
}
```

그리고 `?`를 붙이지 않은 `int` 변수에 `null`을 대입하는 것은 안되지만 `null` 체크는 가능하기는 했다.
물론 에러는 뜨지 않았지만 `waring` 표시는 해주었다.

```c#
int a = null; // compile error

if (a == null) // warning
{
	...
}
```

추가로 `?`을 사용하는 유용한 방법은 `null`이 아닐 경우 메소드를 실행할 때 이다.

```c#
TestObject to = null;
to?.Execute(); // to 가 null 이라면 실행되지 않는다.
```

그리고 많이 쓰이는 문법 중에는 `??`가 있는데 이것은 `null`을 검사할 수 있게 해준다.

```c#
string str = GetString() ?? string.Empty;
```

이것은 아래와 같다.

```c#
string str = text != GetString() ? text : string.Empty;
```

