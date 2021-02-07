import React from 'react';
import PropTypes from 'prop-types';

import { faHome } from "@fortawesome/free-solid-svg-icons";
import { faTachometerAlt } from "@fortawesome/free-solid-svg-icons";
import { faCog } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import SidebarDivider from './components/SidebarDivider';
import SidebarBrand from './components/SidebarBrand';
import SidebarHeading from './components/SidebarHeading';
import SidebarNavItem from './components/SidebarNavItem';

export default function Sidebar(props) {

    const classSidebar = props.toggled ? 
        'navbar-nav bg-gradient-primary sidebar sidebar-dark accordion' : 
        'navbar-nav bg-gradient-primary sidebar sidebar-dark accordion toggled';

    function toggleSidebar() {
        props.setToggled(!props.toggled);
    }

    return (
        
            <ul className={classSidebar} id="accordionSidebar">
                <SidebarBrand />
                <SidebarDivider />
                <SidebarNavItem text="Home" icon=<FontAwesomeIcon icon={faHome} /> href="/" />
                <SidebarNavItem text="Dashboard" icon=<FontAwesomeIcon icon={faTachometerAlt} /> href="/dashboard" />
                <SidebarNavItem text="Preferences" icon=<FontAwesomeIcon icon={faCog} /> href="/preferences" />
                <SidebarHeading text="Портфель" />
                <SidebarDivider />

                <div className="text-center d-none d-md-inline">
                    <button id="sidebarToggle" className="rounded-circle border-0" onClick={toggleSidebar}></button>
                </div>

            </ul>
        
    );

}

Sidebar.propTypes = {
    toggled: PropTypes.bool.isRequired,
    setToggled: PropTypes.func.isRequired
}

