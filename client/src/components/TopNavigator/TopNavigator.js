import React, { useState, useEffect } from 'react';
import { Nav, NavDropdown } from 'react-bootstrap';

import { authenticationService } from '../../services';

import { faBars } from "@fortawesome/free-solid-svg-icons";
import { faUser } from "@fortawesome/free-solid-svg-icons";
import { faCog } from "@fortawesome/free-solid-svg-icons";
import { faSignOutAlt } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";



export default function TopNavigator(props) {

    const [user, setUser] = useState({});

    const navUser = () => (
        <div>
            <span className="mr-2">{user.first_name} {user.last_name}</span>
            <FontAwesomeIcon icon={faUser} />
        </div>
    );

    useEffect(() => {
        const currentUser = authenticationService.currentUserValue;
        if (currentUser) {
            setUser(currentUser.user);
        }
    }, []); 

    return (
        <Nav
            className="navbar navbar-expand navbar-light bg-white topbar mb-4 static-top shadow" 
            as="nav"
        >

            <button id="sidebarToggleTop" className="btn btn-link d-md-none rounded-circle mr-3">
                <FontAwesomeIcon icon={faBars} />
            </button>

            <Nav as="ul" className="navbar-nav ml-auto">
                <NavDropdown title={navUser()} className="no-arrow">
                    <NavDropdown.Item href="/user">
                        <span className="mr-2 text-gray-400"><FontAwesomeIcon icon={faUser} /></span>
                        Profile
                    </NavDropdown.Item>
                    <NavDropdown.Item href="#">
                        <span className="mr-2 text-gray-400"><FontAwesomeIcon icon={faCog} /></span>
                        Settings
                    </NavDropdown.Item>
                    <NavDropdown.Divider />
                    <NavDropdown.Item href="/logout">
                        <span className="mr-2 text-gray-400"><FontAwesomeIcon icon={faSignOutAlt} /></span>
                        Log out
                    </NavDropdown.Item>
                </NavDropdown>
            </Nav>

        </Nav>
    );

}