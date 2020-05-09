import React from 'react';
import {Link} from "react-router-dom";
import './DesktopMenu.scss';

export const DesktopMenu = () => (
    <div className="desktop-menu">
        <div>
            <a onClick={onClickDev}>개발</a>
            <div id="dev-menu" className="sub-menu" onClick={closeSubMenu}>
                <div>
                    <Link to="/dev">전체</Link>
                </div>
                <div>
                    <Link to="/dev?c=os">OS Study</Link>
                </div>
                <div>
                    <Link to="/dev?c=cs">C#</Link>
                </div>
            </div>
        </div>
        <Link to="/etc" onClick={closeSubMenu}>끄적끄적</Link>
        <Link to="/who" onClick={closeSubMenu}>Nero is</Link>
    </div>
);

const onClickDev = () => {
    const display = document.getElementById("dev-menu").style.display;
    if (!display || display === "none") {
        document.getElementById("dev-menu").style.display = "block";
    } else {
        document.getElementById("dev-menu").style.display = "none";
    }
};

const closeSubMenu = () => {
    document.getElementById("dev-menu").style.display = "none";
};