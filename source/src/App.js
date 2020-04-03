import React from 'react';
import {HashRouter as Router, Route} from 'react-router-dom';
import './App.css';
import {DesktopMenu} from './menu/DesktopMenu';
import Who from './page/Who';
import ContentsList from './page/ContentsList';
import Contents from "./page/Contents";

function App() {
    return (
        <div className="App">
            <Router>
                <DesktopMenu/>
                <div className="container">
                    <Route exact path="/" render={() => <ContentsList basicPath="/dev" listPath="/contents/dev-list.json"/>}/>
                    <Route path="/dev" render={() => <ContentsList basicPath="/dev" listPath="/contents/dev-list.json"/>}/>
                    <Route path="/etc" render={() => <ContentsList basicPath="/etc" listPath="/contents/etc-list.json"/>}/>
                    <Route path="/who" component={Who}/>
                    <Route path="/contents" component={Contents}/>
                </div>
            </Router>
        </div>
    );
}

export default App;
