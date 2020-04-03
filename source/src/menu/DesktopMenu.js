import React from 'react';
import {Link} from "react-router-dom";
import './DesktopMenu.scss';

export const DesktopMenu = () => (
    <div className="desktop-menu">
        <Link to="/dev">개발</Link>
        <Link to="/etc">끄적끄적</Link>
        <Link to="/who">Nero is</Link>
    </div>
);