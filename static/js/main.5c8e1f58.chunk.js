(this["webpackJsonpknero-brog"]=this["webpackJsonpknero-brog"]||[]).push([[0],{22:function(e,t,a){e.exports=a(40)},27:function(e,t,a){},28:function(e,t,a){},29:function(e,t,a){},35:function(e,t,a){},36:function(e,t,a){},37:function(e,t,a){},38:function(e,t,a){},40:function(e,t,a){"use strict";a.r(t);var n=a(0),r=a.n(n),c=a(19),o=a.n(c),s=(a(27),a(9)),l=a(11),i=(a(28),a(4)),m=a(5),u=a(7),p=a(6),h=a(8),d=(a(29),function(e){function t(e){var a;Object(i.a)(this,t),a=Object(u.a)(this,Object(p.a)(t).call(this,e));var n=window.pageYOffset;return window.onscroll=function(){var e=window.pageYOffset;document.getElementById("desktop-menu").style.top=n>e?"0":"-50px",n=e},a}return Object(h.a)(t,e),Object(m.a)(t,[{key:"render",value:function(){return r.a.createElement("div",{id:"desktop-menu",className:"desktop-menu"},r.a.createElement(s.b,{to:"/dev"},"\uac1c\ubc1c"),r.a.createElement(s.b,{to:"/etc"},"\ub044\uc801\ub044\uc801"),r.a.createElement(s.b,{to:"/who"},"K.Nero"))}}]),t}(r.a.Component)),v=(a(35),function(e){var t=e.name,a=e.url;return r.a.createElement("a",{className:"url-card",target:"_blank",rel:"noopener noreferrer",href:a},t)}),f=function(e){var t=e.name,a=e.intro,n=e.url,c=e.stackCss;return r.a.createElement("div",{className:"row"},r.a.createElement("div",{className:"col-sm-3"}),r.a.createElement("div",{className:"col-sm-6"},r.a.createElement("a",{className:c,target:"_blank",rel:"noopener noreferrer",href:n},r.a.createElement("strong",null,t),r.a.createElement("div",null,a))),r.a.createElement("div",{className:"col-sm-3"}))},E=function(e){function t(){return Object(i.a)(this,t),Object(u.a)(this,Object(p.a)(t).apply(this,arguments))}return Object(h.a)(t,e),Object(m.a)(t,[{key:"render",value:function(){return r.a.createElement("div",{className:"who"},r.a.createElement("div",{className:"row"},r.a.createElement("div",{className:"col-sm-6"},r.a.createElement("img",{alt:"nero",src:"/knero-1.png"})),r.a.createElement("div",{className:"col-sm-6 my-info"},r.a.createElement("div",{className:"nickname"},"K.Nero"),r.a.createElement("div",null,"kwon-s-m@daum.net"),r.a.createElement("div",{className:"intro"},"#Java #C# #Backend #FullSt... #React_Native #React #Spring #Android #iOS #app_publishing #I_love_Network #AWS #SQL_a_little #CTO_Mask_maybe"))),r.a.createElement("div",{className:"row"},r.a.createElement("div",{className:"col-sm-12"},r.a.createElement(v,{name:"Linked in",url:"https://www.linkedin.com/in/seongminKwon",colCss:"col-sm-3"}),r.a.createElement(v,{name:"github",url:"https://github.com/KNero?tab=repositories",colCss:"col-sm-3"}),r.a.createElement(v,{name:"tistory",url:"https://jamcode.tistory.com",colCss:"col-sm-3"}))),r.a.createElement("div",{className:"row"},r.a.createElement("div",{className:"col-sm-12 legacy-stack-text"},"github repository")),r.a.createElement(f,{name:"jwt-security",intro:"JWT \uc640 Role \uc744 \ud1b5\ud55c \uc11c\ube44\uc2a4 \uc811\uadfc \uc81c\uc5b4",url:"https://github.com/KNero/jwt-security",stackCss:"legacy-stack-jwt"}),r.a.createElement(f,{name:"ExOf",intro:"\uac00\ubcbc\uc6b4 \ud504\ub808\uc784\uc6cc\ud06c. \uc26c\uc6b4 \uc0ac\uc6a9 \ubc29\ubc95\uc744 \ud1b5\ud55c \ube60\ub978 \uc11c\ube44\uc2a4 \ud638\ucd9c",url:"https://knero.github.io/ExOf",stackCss:"legacy-stack-exof"}),r.a.createElement(f,{name:"SQLite-Helper",intro:"SQLite Multi Thread And Single Connection Pool",url:"https://knero.github.io/SQLite-Helper/",stackCss:"legacy-stack-sqlite"}),r.a.createElement(f,{name:"poi-relative-cell",intro:"Improved use to POI",url:"https://github.com/KNero/poi-relative-cell",stackCss:"legacy-stack-cell"}),r.a.createElement(f,{name:"FileQueue",intro:"Serverless file queue",url:"https://github.com/KNero/FileQueue",stackCss:"legacy-stack-queue"}),r.a.createElement(f,{name:"ETree",intro:"javascript tree component",url:"https://github.com/KNero/ETree",stackCss:"legacy-stack-etree"}))}}]),t}(r.a.Component),b=(a(36),function(e){var t=e.subject,a=e.description,n=e.url;return r.a.createElement("div",{className:"row"},r.a.createElement("div",{className:"col-sm-2"}),r.a.createElement("div",{className:"col-sm-8 contents-banner"},r.a.createElement(s.b,{to:"/contents?path="+n},r.a.createElement("div",{className:"effect"},r.a.createElement("div",{className:"banner"},r.a.createElement("div",{className:"subject"},t),r.a.createElement("div",{className:"description"},a))))),r.a.createElement("div",{className:"col-sm-2"}))}),g=(a(37),function(e){function t(){var e,a;Object(i.a)(this,t);for(var n=arguments.length,r=new Array(n),c=0;c<n;c++)r[c]=arguments[c];return(a=Object(u.a)(this,(e=Object(p.a)(t)).call.apply(e,[this].concat(r)))).state={pageNumber:[]},a}return Object(h.a)(t,e),Object(m.a)(t,[{key:"componentDidMount",value:function(){for(var e=this.props,t=e.path,a=e.totalPage,n=e.onClick,c=[],o=function(e){c.push(r.a.createElement(s.b,{key:"page"+e,to:t+"?page="+e,onClick:function(){return n(e)}},r.a.createElement("span",{className:"page-number"},e)))},l=1;l<=a;++l)o(l);this.setState({pageNumber:c})}},{key:"render",value:function(){return r.a.createElement("div",{className:"page-number-back"},this.state.pageNumber.map((function(e){return e})))}}]),t}(r.a.Component)),k=function(e){function t(){var e,a;Object(i.a)(this,t);for(var n=arguments.length,c=new Array(n),o=0;o<n;o++)c[o]=arguments[o];return(a=Object(u.a)(this,(e=Object(p.a)(t)).call.apply(e,[this].concat(c)))).state={list:[],pageNumber:null},a.loadContentsList=function(e){fetch(a.props.listPath).then((function(e){return e.json()})).then((function(t){if(t.length>0){var n=0,c=[];t[e-1].forEach((function(e){return c.push(r.a.createElement(b,{key:"contents"+n++,subject:e.sub,description:e.des,url:e.path}))})),a.setState({list:c,pageNumber:r.a.createElement(g,{path:a.props.basicPath,totalPage:t.length,onClick:a.loadContentsList})})}}))},a}return Object(h.a)(t,e),Object(m.a)(t,[{key:"componentDidMount",value:function(){var e=1;if(this.props.location&&this.props.location.search){var t=this.props.location.search.split("?page=");2===t.length&&(e=Number(t[1]))}this.loadContentsList(e)}},{key:"render",value:function(){return r.a.createElement("div",null,this.state.list.map((function(e){return e})),this.state.pageNumber)}}]),t}(r.a.Component),N=(a(38),new(a(39).Converter)({tables:!0,strikethrough:!0,simpleLineBreaks:!1})),y=function(e){function t(){var e,a;Object(i.a)(this,t);for(var n=arguments.length,r=new Array(n),c=0;c<n;c++)r[c]=arguments[c];return(a=Object(u.a)(this,(e=Object(p.a)(t)).call.apply(e,[this].concat(r)))).state={contests:""},a}return Object(h.a)(t,e),Object(m.a)(t,[{key:"componentDidMount",value:function(){var e=this;if(this.props.location.search){var t=this.props.location.search.split("?path=");2===t.length&&fetch(t[1]).then((function(e){return e.text()})).then((function(t){return e.setState({contents:N.makeHtml(t)})}))}}},{key:"render",value:function(){var e=this;return r.a.createElement("div",{className:"contents"},r.a.createElement("a",{onClick:function(){return e.props.history.goBack()}},"\ubaa9\ub85d\uc73c\ub85c"),r.a.createElement("div",{style:{textAlign:"left"},dangerouslySetInnerHTML:{__html:this.state.contents}}),r.a.createElement("a",{onClick:function(){return e.props.history.goBack()}},"\ubaa9\ub85d\uc73c\ub85c"))}}]),t}(r.a.Component);var j=function(){return r.a.createElement("div",{className:"App"},r.a.createElement(s.a,null,r.a.createElement(d,null),r.a.createElement("div",{className:"container"},r.a.createElement(l.a,{exact:!0,path:"/",render:function(){return r.a.createElement(k,{basicPath:"/dev",listPath:"/contents/dev-list.json"})}}),r.a.createElement(l.a,{path:"/dev",render:function(){return r.a.createElement(k,{basicPath:"/dev",listPath:"/contents/dev-list.json"})}}),r.a.createElement(l.a,{path:"/etc",render:function(){return r.a.createElement(k,{basicPath:"/etc",listPath:"/contents/etc-list.json"})}}),r.a.createElement(l.a,{path:"/who",component:E}),r.a.createElement(l.a,{path:"/contents",component:y}))))};Boolean("localhost"===window.location.hostname||"[::1]"===window.location.hostname||window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/));o.a.render(r.a.createElement(j,null),document.getElementById("root")),"serviceWorker"in navigator&&navigator.serviceWorker.ready.then((function(e){e.unregister()})).catch((function(e){console.error(e.message)}))}},[[22,1,2]]]);
//# sourceMappingURL=main.5c8e1f58.chunk.js.map