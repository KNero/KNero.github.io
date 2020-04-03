import React from 'react';
import {ContentsBanner} from "./ContentsBanner";
import PageNumberList from "./PageNumberList";

const PAGE_SIZE = 10;

export default class ContentsList extends React.Component {
    state = {list: [], pageNumber: null, totalPage: 1, selectedPage: 1};

    componentDidMount() {
        this.changePageByQueryString();

        window.addEventListener("hashchange", this.changePageByQueryString, false);
    }

    componentWillUnmount() {
        window.removeEventListener("hashchange", this.changePageByQueryString, false);
    }

    changePageByQueryString = () => {
        let page = 1;

        if (window.location.hash) {
            const pageParam = window.location.hash.split("?page=");
            if (pageParam.length === 2) {
                try {
                    page = Number(pageParam[1]);
                } catch (e) {
                    page = 1;
                }
            }
        }

        this.loadContentsList(page);
    };

    loadContentsList = (page) => {
        fetch(this.props.listPath)
            .then(response => response.json())
            .then(responseJson => {
                if (responseJson.length > 0) {
                    let list = [];

                    for (let i = PAGE_SIZE * (page - 1); i < PAGE_SIZE * page; ++i) {
                        const data = responseJson[i];
                        if (data) {
                            list.push(<ContentsBanner key={"contents" + i}
                                                      subject={data.sub}
                                                      description={data.des}
                                                      url={data.path}
                                                      date={ContentsList.extractDateFromPath(data.path)}
                                                      page={page}/>);
                        } else {
                            break;
                        }

                    }

                    this.setState({list: list, totalPage: (responseJson.length / PAGE_SIZE) + 1, selectedPage: page});
                }
            });
    };

    static extractDateFromPath(path) {
        let pathParts = path.split("/");
        return pathParts[3] + '.' + pathParts[4] + "." + pathParts[5];
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