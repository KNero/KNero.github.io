import React from 'react';
import "./PageNumberList.scss";

export default class PageNumberList extends React.Component {
    render() {
        const {path, totalPage} = this.props;
        let pageNumberList = [];

        for (let i = 1; i <= totalPage; ++i) {
            pageNumberList.push(<PageNumber key={"page" + i} path={path} index={i} selected={i === this.props.selected}/>);
        }

        return (
            <div className="page-number-back">
                {pageNumberList.map(row => row)}
            </div>
        );
    }
}

const PageNumber = ({path, index, selected}) => (
    <a onClick={() => onClickNumber(index)}>
        <span className={selected ? "page-number selected" : "page-number"}>{index}</span>
    </a>
);

const onClickNumber = (page) => {
    if (window.location.hash.indexOf("?") > -1) {
        const hash = window.location.hash;
        const pageStart = hash.indexOf("page=");
        let pageEnd = hash.length;

        if (pageStart > -1) {
            for (let i = pageStart; i < hash.length; i++) {
                if (hash.charAt(i) === "&") {
                    pageEnd = i;
                    break;
                }
            }

            window.location.hash = hash.split("page=")[0] + "page=" + page + hash.substring(pageEnd);
        } else {
            window.location.hash += "&page=" + page;
        }
    } else {
        window.location.hash = "?page=" + page;
    }
};