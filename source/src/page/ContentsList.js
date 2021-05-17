import React from 'react';
import {ContentsBanner} from "./ContentsBanner";
import PageNumberList from "./PageNumberList";
import Contents from "./Contents";

const PAGE_SIZE = 10;

export default class ContentsList extends React.Component {
    state = {list: [], pageNumber: null, totalPage: 1, selectedPage: 1};
    queryStringMap = {};

    componentDidMount() {
        this.changePageByQueryString();

        window.addEventListener("hashchange", this.changePageByQueryString, false);
    }

    componentWillUnmount() {
        window.removeEventListener("hashchange", this.changePageByQueryString, false);
    }

    changePageByQueryString = () => {
        const qIndex = window.location.hash.indexOf("?");
        if (qIndex > -1) {
            this.queryStringMap = Contents.parseQuery(window.location.hash.substring(qIndex));
        } else {
            this.queryStringMap = {};
        }

        this.loadContentsList();
    };

    loadContentsList = () => {
        let page = Number(this.queryStringMap.page);
        if (!page || page < 1) {
            page = 1;
        }

        fetch(this.props.listPath)
            .then(response => response.json())
            .then(responseJson => {
                if (responseJson.length > 0) {
                    let originList = this.filterContents(responseJson);

                    let list = [];

                    for (let i = PAGE_SIZE * (page - 1); i < PAGE_SIZE * page; ++i) {
                        const contentsBanner = ContentsList.createContentsBanner(originList, i, page);

                        if (contentsBanner) {
                            list.push(contentsBanner);
                        } else {
                            break;
                        }
                    }

                    const add = originList.length % PAGE_SIZE > 0 ? 1 : 0;
                    this.setState({list: list, totalPage: (originList.length / PAGE_SIZE) + add, selectedPage: page});
                }
            });
    };

    filterContents = (allContents) => {
        const result = [];

        allContents.forEach(row => {
            let isOk = true;
            if (this.queryStringMap.f) {
                isOk = row.sub.startsWith(this.queryStringMap.f);
            }

            if (isOk) {
                result.push(row);
            }
        });

        return result;
    };

    static createContentsBanner(list, i, page) {
        const data = list[i];

        if (data) {
            let query = "";
            if (window.location.hash.indexOf("?") > -1) {
                const hash = window.location.hash;
                query = hash.split("?")[1];
            }

            return <ContentsBanner key={"contents" + i}
                                   subject={(list.length - i) + ". " + data.sub}
                                   description={data.des}
                                   url={data.path}
                                   page={page}
                                   query={query}/>;
        } else {
            return null;
        }
    }

    render() {
        return (
            <div>
                {this.state.list.map(row => row)}
                <PageNumberList path={this.props.basicPath} totalPage={this.state.totalPage} selected={this.state.selectedPage}/>
            </div>
        );
    }
}