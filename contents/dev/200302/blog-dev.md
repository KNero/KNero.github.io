# github + reactjs 로 개인 블로그 만들기

깃헙은 자신의 닉네임 + ".github.io" 라는 repository를 만들면 `https://닉네임.github.io` 로 repository 의 index.html 을 serving 해주는 기능이 있다. 이것을 활용하면 간단한 블로그를 만들수 있는데 이를 활용한 기술블로그를 운영하는 분들도 꽤있고 (우아한 형제들의 기술블로그)[https://woowabros.github.io]도 github 으로 만들어져 있다.

백엔드 없이 index.html 만 전달하기 때문에 약간의 제약사항이 있지만 글을 게시하기에는 상당히 매력적인 기능이다. 나는 여기에 재미있게 배웠던 reactjs 를 사용하기로 하고 해결해야 할 것을 생각해 봤다.

1. root 페이직 아닌 경로에서 새로고침을 했을 때 index.html 를 전달해줘야 하지만 github 은 그 경로의 파일을 내려준다. 예) `https://knero.github.io/a/b/c` 에서는 새로고침을 하면 index.html 404 거나 파일이 있다면 파일이 전달된다.
2. markdown 형식으로 글을 올리면 github 에서도 볼 수 있고 블로그에서도 볼 수 있는데 최대한 같은 markdown parser 을 사용해야한다.
3. DB 는 없지만 게시물 목록 화면에서 페이징처리가 가능해야한다.
4. 게시목록 정보는 외부파일로 분리해야 한다. (글을 게시할 때 마다 빌드/배포하는 것은 안된다고 생각한다.)

reactjs 는 `16.12.0` 버전을 사용했고 reactjs 홈페이지의 getting start 를 따라서 `create-react-app` 로 아주 손쉽게 환경을 구축하 수 있었다. 내가 배웠을 때와 달리 필요한 대부분의 라이브러리들이 포함되어 있어서 신경쓸 것이 거의 없었다. 이제 위의 해결해야 할 점들을 하나씩 해결하며 개발을 시작했다.

### 해결방법
1. 페이지 이동은 reactjs 의 `HashRouter`를 사용했다. 이를 사용하면 새로고침시에도 index.html 을 내려받으 수 있다.
 => `https://knero.github.io#/a/b/c`
2. `showdown` 이라는 마크다운 파서를 사용했는데 찾아본 3개 중에서 가장 github 과 비슷해서 골랐다. `showdown` 은 ~~취소선~~을 사용하고 싶다면 생성자에 옵션을 추가해줘야 한다.
```javascript
const MARKDOWN_CONVERTER = new MARKDOWN.Converter({
    'tables':true,
    'strikethrough':true,
    'simpleLineBreaks':true
});
```

3/4. 페이징 처리와 외부파일로 게
