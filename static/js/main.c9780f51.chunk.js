(this["webpackJsonpknero-brog"]=this["webpackJsonpknero-brog"]||[]).push([[0],{22:function(e,t,a){e.exports=a(40)},27:function(e,t,a){},28:function(e,t,a){},29:function(e,t,a){},35:function(e,t,a){},36:function(e,t,a){},37:function(e,t,a){},39:function(e,t,a){},40:function(e,t,a){"use strict";a.r(t);var n=a(0),r=a.n(n),c=a(19),s=a.n(c),l=(a(27),a(2)),o=a(11),i=(a(28),a(29),function(){return r.a.createElement("div",{className:"desktop-menu"},r.a.createElement("div",null,r.a.createElement("a",{onClick:m},"\uac1c\ubc1c"),r.a.createElement("div",{id:"dev-menu",className:"sub-menu",onClick:u},r.a.createElement("div",null,r.a.createElement(l.b,{to:"/dev"},"\uc804\uccb4")),r.a.createElement("div",null,r.a.createElement(l.b,{to:"/dev?c=os"},"OS Study")),r.a.createElement("div",null,r.a.createElement(l.b,{to:"/dev?c=cs"},"C#")))),r.a.createElement(l.b,{to:"/etc",onClick:u},"\ub044\uc801\ub044\uc801"),r.a.createElement(l.b,{to:"/who",onClick:u},"Nero is"))}),m=function(){var e=document.getElementById("dev-menu").style.display;document.getElementById("dev-menu").style.display=e&&"none"!==e?"none":"block"},u=function(){document.getElementById("dev-menu").style.display="none"},h=a(6),d=a(7),p=a(9),v=a(8),E=a(10),g=(a(35),function(e){var t=e.name,a=e.url;return r.a.createElement("a",{className:"url-card",target:"_blank",rel:"noopener noreferrer",href:a},t)}),f=function(e){var t=e.name,a=e.intro,n=e.url,c=e.stackCss;return r.a.createElement("div",{className:"row"},r.a.createElement("div",{className:"col-sm-3"}),r.a.createElement("div",{className:"col-sm-6"},r.a.createElement("a",{className:c,target:"_blank",rel:"noopener noreferrer",href:n},r.a.createElement("strong",null,t),r.a.createElement("div",null,a))),r.a.createElement("div",{className:"col-sm-3"}))},b=function(e){function t(){return Object(h.a)(this,t),Object(p.a)(this,Object(v.a)(t).apply(this,arguments))}return Object(E.a)(t,e),Object(d.a)(t,[{key:"render",value:function(){return r.a.createElement("div",{className:"who"},r.a.createElement("div",{className:"row"},r.a.createElement("div",{className:"col-sm-6"},r.a.createElement("img",{alt:"nero",src:"/knero-1.png"})),r.a.createElement("div",{className:"col-sm-6 my-info"},r.a.createElement("div",{className:"nickname"},"K.Nero"),r.a.createElement("div",null,"kwon-s-m@daum.net"),r.a.createElement("div",{className:"intro"},"#Java #C# #Backend #FullSt... #React_Native #React #Spring #Android #iOS #app_publishing #I_love_Network #AWS #SQL_a_little #CTO_Mask_maybe"))),r.a.createElement("div",{className:"row"},r.a.createElement("div",{className:"col-sm-12"},r.a.createElement(g,{name:"Linked in",url:"https://www.linkedin.com/in/seongminKwon",colCss:"col-sm-3"}),r.a.createElement(g,{name:"github",url:"https://github.com/KNero?tab=repositories",colCss:"col-sm-3"}),r.a.createElement(g,{name:"tistory",url:"https://jamcode.tistory.com",colCss:"col-sm-3"}))),r.a.createElement("div",{className:"row"},r.a.createElement("div",{className:"col-sm-12 legacy-stack-text"},"github repository")),r.a.createElement(f,{name:"OS Study",intro:"\ucc45 [64\ube44\ud2b8 \uba40\ud2f0\ucf54\uc5b4 OS \uc6d0\ub9ac\uc640\uad6c\uc870] \ub530\ub77c\ud558\uae30",url:"https://github.com/KNero/os-study",stackCss:"legacy-stack-os"}),r.a.createElement(f,{name:"jwt-security",intro:"JWT \uc640 Role \uc744 \ud1b5\ud55c \uc11c\ube44\uc2a4 \uc811\uadfc \uc81c\uc5b4",url:"https://github.com/KNero/jwt-security",stackCss:"legacy-stack-jwt"}),r.a.createElement(f,{name:"ExOf",intro:"\uac00\ubcbc\uc6b4 \ud504\ub808\uc784\uc6cc\ud06c. \uc26c\uc6b4 \uc0ac\uc6a9 \ubc29\ubc95\uc744 \ud1b5\ud55c \ube60\ub978 \uc11c\ube44\uc2a4 \ud638\ucd9c",url:"https://knero.github.io/ExOf",stackCss:"legacy-stack-exof"}),r.a.createElement(f,{name:"SQLite-Helper",intro:"SQLite Multi Thread And Single Connection Pool",url:"https://knero.github.io/SQLite-Helper/",stackCss:"legacy-stack-sqlite"}),r.a.createElement(f,{name:"poi-relative-cell",intro:"Improved use to POI",url:"https://github.com/KNero/poi-relative-cell",stackCss:"legacy-stack-cell"}),r.a.createElement(f,{name:"FileQueue",intro:"Serverless file queue",url:"https://github.com/KNero/FileQueue",stackCss:"legacy-stack-queue"}),r.a.createElement(f,{name:"ETree",intro:"javascript tree component",url:"https://github.com/KNero/ETree",stackCss:"legacy-stack-etree"}))}}]),t}(r.a.Component),y=(a(36),a(37),new(a(38).Converter)({tables:!0,strikethrough:!0})),k=function(e){function t(){var e,a;Object(h.a)(this,t);for(var n=arguments.length,r=new Array(n),c=0;c<n;c++)r[c]=arguments[c];return(a=Object(p.a)(this,(e=Object(v.a)(t)).call.apply(e,[this].concat(r)))).state={contests:"",data:"",listUrl:""},a}return Object(E.a)(t,e),Object(d.a)(t,[{key:"componentDidMount",value:function(){var e=this;if(this.props.location.search){var a=t.parseQuery(this.props.location.search);a.path&&fetch(a.path).then((function(e){return e.text()})).then((function(n){return e.setState({contents:y.makeHtml(n),date:t.extractDateFromPath(a.path),listUrl:"/"+a.path.split("/")[2]+"?page="+a.page})}))}}},{key:"render",value:function(){return r.a.createElement("div",{className:"contents"},r.a.createElement("div",{className:"col-sm-1"}),r.a.createElement("div",{className:"col-sm-10"},r.a.createElement(l.b,{to:this.state.listUrl},"\ubaa9\ub85d\uc73c\ub85c"),r.a.createElement("div",{className:"date"},"\uc791\uc131\uc77c : ",this.state.date),r.a.createElement("div",{style:{textAlign:"left"},dangerouslySetInnerHTML:{__html:this.state.contents}}),r.a.createElement(l.b,{to:this.state.listUrl},"\ubaa9\ub85d\uc73c\ub85c")),r.a.createElement("div",{className:"col-sm-1"}))}}],[{key:"parseQuery",value:function(e){for(var t={},a=("?"===e[0]?e.substr(1):e).split("&"),n=0;n<a.length;n++){var r=a[n].split("=");t[decodeURIComponent(r[0])]=decodeURIComponent(r[1]||"")}return t}},{key:"extractDateFromPath",value:function(e){var t=e.split("/"),a=t.length;return t[a-4]+"."+t[a-3]+"."+t[a-2]}}]),t}(r.a.Component),N=function(e){var t=e.subject,a=e.description,n=e.url,c=e.page;return r.a.createElement("div",{className:"row"},r.a.createElement("div",{className:"col-sm-2"}),r.a.createElement("div",{className:"col-sm-8 contents-banner"},r.a.createElement(l.b,{to:"/contents?path="+n+"&page="+c},r.a.createElement("div",{className:"button type2"},r.a.createElement("div",{className:"subject"},t),r.a.createElement("div",{className:"description"},a),r.a.createElement("div",{className:"date"},k.extractDateFromPath(n))))),r.a.createElement("div",{className:"col-sm-2"}))},w=(a(39),function(e){function t(){return Object(h.a)(this,t),Object(p.a)(this,Object(v.a)(t).apply(this,arguments))}return Object(E.a)(t,e),Object(d.a)(t,[{key:"render",value:function(){for(var e=this.props,t=e.path,a=e.totalPage,n=[],c=1;c<=a;++c)n.push(r.a.createElement(C,{key:"page"+c,path:t,index:c,selected:c===this.props.selected}));return r.a.createElement("div",{className:"page-number-back"},n.map((function(e){return e})))}}]),t}(r.a.Component)),C=function(e){var t=e.path,a=e.index,n=e.selected;return r.a.createElement(l.b,{to:t+"?page="+a,onClick:function(){return window.scrollTo({top:0})}},r.a.createElement("span",{className:n?"page-number selected":"page-number"},a))},j=function(e){function t(){var e,a;Object(h.a)(this,t);for(var n=arguments.length,r=new Array(n),c=0;c<n;c++)r[c]=arguments[c];return(a=Object(p.a)(this,(e=Object(v.a)(t)).call.apply(e,[this].concat(r)))).state={list:[],pageNumber:null,totalPage:1,selectedPage:1},a.queryStringMap={},a.changePageByQueryString=function(){var e=window.location.hash.indexOf("?");a.queryStringMap=e>-1?k.parseQuery(window.location.hash.substring(e)):{},a.loadContentsList()},a.loadContentsList=function(){var e=Number(a.queryStringMap.page);(!e||e<1)&&(e=1),fetch(a.props.listPath).then((function(e){return e.json()})).then((function(n){if(n.length>0){for(var r=a.filterContents(n),c=[],s=10*(e-1);s<10*e;++s){var l=t.createContentsBanner(r,s,e);if(!l)break;c.push(l)}a.setState({list:c,totalPage:r.length/10+1,selectedPage:e})}}))},a.filterContents=function(e){var t=[];return e.forEach((function(e){a.filterCategory(e)&&t.push(e)})),t},a.filterCategory=function(e){switch(a.queryStringMap.c){case"os":return e.sub.startsWith("[OS Study]");case"cs":return e.sub.startsWith("[C#]")}return!0},a}return Object(E.a)(t,e),Object(d.a)(t,[{key:"componentDidMount",value:function(){this.changePageByQueryString(),window.addEventListener("hashchange",this.changePageByQueryString,!1)}},{key:"componentWillUnmount",value:function(){window.removeEventListener("hashchange",this.changePageByQueryString,!1)}},{key:"render",value:function(){return r.a.createElement("div",null,this.state.list.map((function(e){return e})),r.a.createElement(w,{path:this.props.basicPath,totalPage:this.state.totalPage,selected:this.state.selectedPage}))}}],[{key:"createContentsBanner",value:function(e,t,a){var n=e[t];return n?r.a.createElement(N,{key:"contents"+t,subject:t+1+". "+n.sub,description:n.des,url:n.path,page:a}):null}}]),t}(r.a.Component);var O=function(){return r.a.createElement("div",{className:"App"},r.a.createElement(l.a,null,r.a.createElement(i,null),r.a.createElement("div",{className:"container"},r.a.createElement(o.a,{exact:!0,path:"/",render:function(){return r.a.createElement(j,{basicPath:"/dev",listPath:"/contents/dev-list.json"})}}),r.a.createElement(o.a,{path:"/dev",render:function(){return r.a.createElement(j,{basicPath:"/dev",listPath:"/contents/dev-list.json"})}}),r.a.createElement(o.a,{path:"/etc",render:function(){return r.a.createElement(j,{basicPath:"/etc",listPath:"/contents/etc-list.json"})}}),r.a.createElement(o.a,{path:"/who",component:b}),r.a.createElement(o.a,{path:"/contents",component:k}))))};Boolean("localhost"===window.location.hostname||"[::1]"===window.location.hostname||window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/));s.a.render(r.a.createElement(O,null),document.getElementById("root")),"serviceWorker"in navigator&&navigator.serviceWorker.ready.then((function(e){e.unregister()})).catch((function(e){console.error(e.message)}))}},[[22,1,2]]]);
//# sourceMappingURL=main.c9780f51.chunk.js.map