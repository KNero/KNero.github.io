import React from 'react';
import {Link} from "react-router-dom";
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
    <Link to={path + "?page=" + index} onClick={() => window.scrollTo({top: 0})}>
        <span className={selected ? "page-number selected" : "page-number"}>{index}</span>
    </Link>
);