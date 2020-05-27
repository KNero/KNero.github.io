import React from 'react';
import {Link} from "react-router-dom";
import './Contents.scss';

const MARKDOWN = require('showdown');
const MARKDOWN_CONVERTER = new MARKDOWN.Converter({
    tables:true,
    strikethrough:true
});

export default class Contents extends React.Component {
    state = {contests: "", data: "", listUrl: ""};

    componentDidMount() {
        if (this.props.location.search) {
            let queryMap = Contents.parseQuery(this.props.location.search);

            if (queryMap.path) {
                fetch(queryMap.path)
                    .then(response => response.text())
                    .then(responseText => this.setState({
                        contents: MARKDOWN_CONVERTER.makeHtml(responseText),
                        date: Contents.extractDateFromPath(queryMap.path),
                        listUrl: "/" + queryMap.path.split("/")[2] + "?" + this.props.location.search.split(queryMap.path + "&")[1]
                    }));
            }
        }
    }

    static parseQuery(queryString) {
        let query = {};
        let pairs = (queryString[0] === '?' ? queryString.substr(1) : queryString).split('&');
        for (let i = 0; i < pairs.length; i++) {
            let pair = pairs[i].split('=');
            query[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1] || '');
        }
        return query;
    }

    static extractDateFromPath(path) {
        let pathParts = path.split("/");
        const arrayLength = pathParts.length;

        return pathParts[arrayLength - 4] + "." + pathParts[arrayLength - 3] + "." + pathParts[arrayLength - 2];
    }

    render() {
        return (
            <div className="contents">
                <div className="col-sm-1"/>
                <div className="col-sm-10">
                    <Link to={this.state.listUrl}>목록으로</Link>
                    <div className="date">작성일 : {this.state.date}</div>
                    <div style={{textAlign: 'left'}} dangerouslySetInnerHTML={{__html: this.state.contents}}/>
                    <Link to={this.state.listUrl}>목록으로</Link>
                </div>
                <div className="col-sm-1"/>
            </div>
        );
    }
}