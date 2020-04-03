import React from 'react';
import { Link } from "react-router-dom";
import './ContentsBanner.scss';

export const ContentsBanner = ({subject, description, url, date, page}) => (
    <div className="row">
        <div className="col-sm-2"/>
        <div className="col-sm-8 contents-banner">
            <Link to={"/contents?path=" + url + "&date=" + date + "&page=" + page}>
                <div className="button type2">
                    <div className="subject">{subject}</div>
                    <div className="description">{description}</div>
                    <div className="date">{date}</div>
                </div>
            </Link>
        </div>
        <div className="col-sm-2"/>
    </div>
);