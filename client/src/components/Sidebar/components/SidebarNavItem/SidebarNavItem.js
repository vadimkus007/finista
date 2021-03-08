import React from 'react';
import PropTypes from 'prop-types';
import {
//     BrowserRouter as Router,
    NavLink
} from "react-router-dom";


export default function SidebarNavItem(props) {

    return(

        <li className="nav-item">
            <NavLink className="nav-link" to={props.href}>
                {props.icon}
                <span>{props.text}</span>
            </NavLink>
        </li>

    );
}

SidebarNavItem.propTypes = {
    text: PropTypes.string.isRequired,
    href: PropTypes.string.isRequired,
    icon: PropTypes.object.isRequired
}