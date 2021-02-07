import React from 'react';
import {Link} from "react-router-dom";
import './DesktopMenu.scss';

export default class DesktopMenu extends React.Component {
    state = {menu: []};

    componentDidMount() {
        console.log(this.props.menuPath);
        fetch(this.props.menuPath)
            .then(response => response.json())
            .then(responseJson => {
                let menuList = [];
                responseJson.forEach(menu => {
                    menuList.push(
                        <div key={menu.path}>
                            <Link to={menu.path}>{menu.name}</Link>
                        </div>
                    );
                });

                this.setState({menu: menuList});
            });
    }

    render() {
        return <div className="desktop-menu">
            <div>
                <a onClick={onClickDev}>dev</a>
                <div id="dev-menu" className="sub-menu" onClick={closeSubMenu}>
                    {this.state.menu}
                </div>
            </div>
            <Link to="/etc" onClick={closeSubMenu}>etc</Link>
            <Link to="/who" onClick={closeSubMenu}>profile</Link>
        </div>;
    }
}

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