import React from 'react';
import PropTypes from 'prop-types';
import {
    BrowserRouter as Router
} from "react-router-dom";


export default function SidebarNavItem(props) {

    return(
        <Router>
        <li className="nav-item">
        <a className="nav-link" href={props.href}>
            {props.icon}
            <span>{props.text}</span></a>
        </li>
        </Router>
    );
}

SidebarNavItem.propTypes = {
    text: PropTypes.string.isRequired,
    href: PropTypes.string.isRequired,
    icon: PropTypes.object.isRequired
}