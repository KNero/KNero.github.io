## Http 비동기 호출

```c#
using System;
using System.IO;
using System.Net;

namespace Test
{
    class Program
    {
        static void Main(string[] args)
        {
            string url = "http://deelay.me/3000/https://github.com/KNero/KNero.github.io";
            var httpRequestInfo = HttpWebRequest.CreateHttp(url);
            var httpResponseInfo = httpRequestInfo.GetResponse() as HttpWebResponse; // 동기 

            var responseStream = httpResponseInfo.GetResponseStream();
            using (var sr = new StreamReader(responseStream))
            {
                var webPage = sr.ReadToEnd();
            }
        }
    }
}
```

`http://deelay.me/3000`를 통해서 3초를 지연하고 github을 호출하는 코드로 `GetResponse` 를 사용하게 되면 동기호출을 하게된다.
이 부분을 `BeginGetResponse`로 수정해서 비동기 호출로 변경해 보자. 

(**Begin, End** 로 시작하는 메소드는 비동기호출을 하기위한 메소드로 자세한 사용방법은 [delegate](https://knero.github.io/#/contents?path=/contents/dev/2021/05/22/csharp-delegate.md&page=1) 글을 읽어보자.)

```c#
static void Main(string[] args)
{
	string url = "http://deelay.me/3000/https://github.com/KNero/KNero.github.io";
	var httpRequestInfo = HttpWebRequest.CreateHttp(url);

	var callback = new AsyncCallback(HttpResponseAvailable);
	var ar = httpRequestInfo.BeginGetResponse(callback, httpRequestInfo); // 비동기 호출

	ar.AsyncWaitHandle.WaitOne(); // 비동기 호출은 background thread 에서 실행되기 때문에 main thread 는 완료를 기다리도록 해준다.
}

private static void HttpResponseAvailable(IAsyncResult ar)
{
	var httpRequestInfo = ar.AsyncState as HttpWebRequest;
	var httpResponseInfo = httpRequestInfo.EndGetResponse(ar);

	var responseStream = httpResponseInfo.GetResponseStream();
	using (var sr = new StreamReader(responseStream))
	{
		var webPage = sr.ReadToEnd();
	}
}
```

## DB 비동기 호출

```c#
using System;
using System.Data.SqlClient;

namespace Test
{
    class Program
    {
        static void Main(string[] args)
        {
            string connectionString = "...";
            string sqlSelect = "SELECT @@VERSION";

            using (var sqlConnection = new SqlConnection(connectionString))
            {
                sqlConnection.Open();

                using (var sqlCommand = new SqlCommand(sqlSelect, sqlConnection))
                {
                    using (var reader = sqlCommand.ExecuteReader()) // 동기 호출
                    {
                        while (reader.Read())
                        {
                            var data = reader[0].ToString();
                        }
                    }
                }
            }
        }
    }
}
```

동기 호출에서 연결이 완료된 후인 `ExecuteReader` 메소드를 비동기 호출인 `BeginExecuteReader` 로 변경해 보자.

(**Begin, End** 로 시작하는 메소드는 비동기호출을 하기위한 메소드로 자세한 사용방법은 [delegate](https://knero.github.io/#/contents?path=/contents/dev/2021/05/22/csharp-delegate.md&page=1) 글을 읽어보자.)

```c#
static void Main(string[] args)
{
	string connectionString = "...";
	string sqlSelect = "SELECT @@VERSION";

	using (var sqlConnection = new SqlConnection(connectionString))
	{
		sqlConnection.Open();

		var sqlCommand = new SqlCommand(sqlSelect, sqlConnection);
		var callback = new AsyncCallback(DataAvailable);
		var ar = sqlCommand.BeginExecuteReader(callback, sqlCommand); // 비동기 호출
		
		ar.AsyncWaitHandle.WaitOne(); // 비동기 호출은 background thread 에서 실행되기 때문에 main thread 는 완료를 기다리도록 해준다.
	}
}

private static void DataAvailable(IAsyncResult ar)
{
	var sqlCommand = ar.AsyncState as SqlCommand;
	using (var reader = sqlCommand.EndExecuteReader(ar))
	{
		while (reader.Read())
		{
			var data = reader[0].ToString();
		}
	}
}
```
