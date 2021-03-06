import React from 'react';
import TopNavigator from '../TopNavigator';
import Sidebar from '../Sidebar';

export default function Nav(props) {

    return (
        <nav className="navbar  navbar-default navbar-static-top" role="navigation" style={{marginBottom: 0}}>
            <TopNavigator />
            <Sidebar />
        </nav>
    );

}