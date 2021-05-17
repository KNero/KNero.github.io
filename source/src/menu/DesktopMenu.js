import React from 'react';
import PropTypes from 'prop-types';
import {Link} from "react-router-dom";
import './DesktopMenu.scss';

export default class DesktopMenu extends React.Component {
    state = {menu: []};

    componentDidMount() {
        fetch(this.props.menuPath)
            .then(response => response.json())
            .then(responseJson => {
                let menuList = [];
                responseJson.forEach(menu => menuList.push(<Link key={menu.path} to={menu.path} onClick={closeNav}>{menu.name}</Link>));

                this.setState({menu: menuList});
            });
    }

    render() {
        return (
            <div className="desktop-menu">
                <div className="show-nav" onClick={openNav}>&#9776;</div>
                <div id="mySidenav" className="sidenav">
                    <a className="closebtn" onClick={closeNav}>&times;</a>
                    {this.state.menu}
                    <Link to="/who" onClick={closeNav}>profile</Link>
                </div>
            </div>
        );
    }
}

DesktopMenu.propTypes = {
    menuPath: PropTypes.string,
};

function openNav() {
    document.getElementById("mySidenav").style.width = "180px";
}

function closeNav() {
    document.getElementById("mySidenav").style.width = "0";
}