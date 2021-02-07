import React from 'react';
import {
    BrowserRouter as Router,
    NavLink
} from "react-router-dom";

import { faLaughWink } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export default function SidebarBrand() {

    return(
         <Router>
            <NavLink to="/" className="sidebar-brand d-flex align-items-center justify-content-center">
                <div className="sidebar-brand-icon rotate-n-15">
                    <FontAwesomeIcon icon={faLaughWink} size="2x" />
                </div>
                <div className="sidebar-brand-text mx-3">FINISTA</div>
            </NavLink>
        </Router>
    );

}