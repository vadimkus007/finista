import React from 'react';
import PropTypes from 'prop-types';

import { faHome } from "@fortawesome/free-solid-svg-icons";
import { faChartArea } from "@fortawesome/free-solid-svg-icons";
import { faTachometerAlt } from "@fortawesome/free-solid-svg-icons";
import { faCog } from "@fortawesome/free-solid-svg-icons";
import { faBriefcase } from "@fortawesome/free-solid-svg-icons";
import { faFileInvoiceDollar } from "@fortawesome/free-solid-svg-icons";
import { faHandshake } from "@fortawesome/free-solid-svg-icons";
import { faChartLine } from "@fortawesome/free-solid-svg-icons";
import { faChartPie } from "@fortawesome/free-solid-svg-icons";
import { faBalanceScaleRight } from "@fortawesome/free-solid-svg-icons";
import { faCalendarAlt } from "@fortawesome/free-solid-svg-icons";
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
                <SidebarNavItem text="Котировки" icon=<FontAwesomeIcon icon={faChartArea} /> href="/quotes" />
                <SidebarNavItem text="Dashboard" icon=<FontAwesomeIcon icon={faTachometerAlt} /> href="/dashboard" />
                <SidebarNavItem text="Preferences" icon=<FontAwesomeIcon icon={faCog} /> href="/preferences" />
                <SidebarNavItem text="События" icon=<FontAwesomeIcon icon={faCalendarAlt} /> href="/calendar" />
                <SidebarNavItem text="Выбор портфеля" icon=<FontAwesomeIcon icon={faBriefcase} /> href="/portfolios" />
                <SidebarDivider />
                <SidebarHeading text="Портфель" />
                <SidebarNavItem text="Активы" icon=<FontAwesomeIcon icon={faFileInvoiceDollar} /> href="/portfolio/actives" />
                <SidebarNavItem text="Сделки" icon=<FontAwesomeIcon icon={faHandshake} /> href="/portfolio/trades" />
                <SidebarNavItem text="Доходность" icon=<FontAwesomeIcon icon={faChartLine} /> href="/portfolio/profit" />
                <SidebarNavItem text="Аналитика" icon=<FontAwesomeIcon icon={faChartPie} /> href="/portfolio/analytics" />
                <SidebarNavItem text="Ребалансировка" icon=<FontAwesomeIcon icon={faBalanceScaleRight} /> href="/portfolio/rebalance" />
                

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

