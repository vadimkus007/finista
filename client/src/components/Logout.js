import React from 'react';
import { Redirect } from 'react-router-dom';
import { authenticationService } from '../services';
import { history } from '../helpers';

export default function Logout() {

    authenticationService.logout();
    history.push('/signin');
    //localStorage.clear("token");
    return <Redirect to="/" push={true} />

}