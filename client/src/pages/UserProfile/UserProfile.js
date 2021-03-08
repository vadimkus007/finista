import React, { useState, useEffect } from 'react';
// import { useHistory } from 'react-router-dom';
import { authHeader } from '../../helpers';
import { authenticationService } from '../../services';
import FormErrors from '../../components/FormErrors';

import { NotificationManager } from 'react-notifications'

export default function UserProfile(props) {

    const [email, setEmail] = useState('');
    const [first_name, setFirstName] = useState('');
    const [last_name, setLastName] = useState('');
    const [password, setPassword] = useState('');

    const [formErrors, setFormErrors] = useState({error: ''});

    const API_URL = 'http://localhost:3001/api/user';

    const authenticateHeader = authHeader();

//     const history = useHistory();

    const handleUserInput = (e) => {
        const name = e.target.name;
        const value = e.target.value;
        if (name === 'first_name') {setFirstName(value)};
        if (name === 'last_name') {setLastName(value)};
        if (name === 'email') {setEmail(value)};
        if (name === 'password') {setPassword(value)};
    }

    function getUser() {

        fetch(API_URL, {
            method: 'GET',
            headers: authenticateHeader
        })
        .then(response => response.json())
        .then(user => {

            if (user) {
                setEmail(user.email);
                setFirstName(user.first_name);
                setLastName(user.last_name);
                setPassword(user.password.slice(0,6));
            }
        })
        .catch(error => {
            setFormErrors({error: error});
            NotificationManager.error(error, 'Error', 2000);
        })
    }

    function updateUser(user) {
        var headers = authenticateHeader;
        headers['Content-Type'] = 'application/json';
        headers['Accept'] = 'application/json';

        return fetch(API_URL, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(user)
        })
        .then(result => result.json());
    }

    const handleSubmit = e => {
        e.preventDefault();

        updateUser({email: email, password: password, first_name: first_name, last_name: last_name})
        .then(response => {

            if (response.message) {
                //setFormErrors({message: response.message});
                NotificationManager.success(response.message, 'Success', 2000);
            }

            if (response.user) {
                return authenticationService.signin(email, password);
            }
        })
        .then(response => {
            
            if (response.message) {
                // setFormErrors({message: response.message});
                NotificationManager.success(response.message, 'Success', 2000);
            }

            if (response.user) {
               // history.push('/');
            } else {
                // setFormErrors({error: response.message});
                NotificationManager.error(response.error, 'Error', 2000);
            }
        })
        .catch(err => {
            // setFormErrors({error: err});
            NotificationManager.error(err, 'Error', 2000);
        });

    }

    useEffect(() => {
        getUser();
    }, []);
    

    return (

        <div className="container-fluid">

            <div className="card shadow mb-4">
                <div className="card-header py-3">
                    <h6 className="m-0 text-primary font-weight-bold">Профиль пользователя</h6>
                </div>
                <div className="card-body">
                    <form id="user" method="POST" onSubmit={handleSubmit}>
                        <div className="form-group row">
                            <label htmlFor="email" className="col-sm-2 col-form-label">Email</label>
                            <div className="col-sm-10">
                                <input type="email" className="form-control" name="email" value={email} placeholder="E-mail..." onChange={handleUserInput}/>
                            </div>
                        </div>
                        <div className="form-group row">
                            <label htmlFor="first_name" className="col-sm-2 col-form-label">First Name</label>
                            <div class="col-sm-10">
                                <input type="text" className="form-control" name="first_name" value={first_name} placeholder="First Name" onChange={handleUserInput}/>
                            </div>
                        </div>
                        <div className="form-group row">
                            <label htmlFor="last_name" className="col-sm-2 col-form-label">Last Name</label>
                            <div className="col-sm-10">
                                <input type="text" className="form-control" name="last_name" value={last_name} placeholder="Last Name" onChange={handleUserInput}/>
                            </div>
                        </div>
                        <div className="form-group row">
                            <label htmlFor="password" className="col-sm-2 col-form-label">Password</label>
                            <div className="col-sm-10">
                                <input type="password" className="form-control" name="password" value={password} placeholder="password" onChange={handleUserInput}/>
                            </div>
                        </div>
                        <div className="form-group row">
                            <button type="submit" className="btn btn-primary btn-sm mr-sm-2" >Сохранить</button>
                        </div>
                    </form>
                    <div className="panel panel-default alert-danger">
                        <FormErrors formErrors={formErrors} />
                    </div>
                </div>
            </div>

        </div>

    );

}