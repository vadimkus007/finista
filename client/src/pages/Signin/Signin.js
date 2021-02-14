import React, { useState } from 'react';
import { useLocation, useHistory } from 'react-router-dom';
// import useToken from '../../useToken';
import { authenticationService } from '../../services';
// import { history } from '../../helpers';
import './signin.css';

import { NotificationManager } from 'react-notifications';

export default function Signin() {

    const [error, setError] = useState(null);
//    const [status, setStatus] = useState();
//    const [submitting, setSubmitting] = useState(true);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const [message, setMessage] = useState('');

    const loc = useLocation();
    const history = useHistory();

    const fromURL = (loc.state) ? loc.state.from.pathname : '/';

    if (authenticationService.currentUserValue) { 
        history.push('/');
    }



        const handleSubmit = async e => {
            e.preventDefault();

            authenticationService.signin(email, password)
            .then(response => {
                if (response.user) {
                    history.push(fromURL);
                } else {
                    // setMessage(response.message);
                    NotificationManager.error(response.message, 'Error!', 2000);
                    history.push('/signin');
                }
            })
            .catch(error => {
                setError(error);
                history.push('/signin');
            });
        };


        return (

        <div className="container">
            <div className="row justify-content-center">
                <div className="col-xl-10 col-lg-12 col-md-9">
                    <div className="card o-hidden border-0 shadow-lg my-5">
                        <div className="card-body p-0 alert-body">
                            <div className="row">
                                <div className="col-lg-6 d-none d-lg-block bg-login-image"></div>
                                <div className="col-lg-6">
                                    <div className="p-5">
                                        <div className="text-center">
                                            <h1 className="h4 text-gray-900 mb-4">Welcome Back!</h1>
                                        </div>
                                        <form className="user" method="POST" onSubmit={handleSubmit}>
                                            <div className="form-group">
                                                <input type="email" name="email" className="form-control form-control-user"
                                                    id="exampleInputEmail" aria-describedby="emailHelp"
                                                    placeholder="Enter Email Address..." onChange={e => setEmail(e.target.value)}/>
                                            </div>
                                            <div className="form-group">
                                                <input type="password" name="password" className="form-control form-control-user"
                                                    id="exampleInputPassword" placeholder="Password" onChange={e => setPassword(e.target.value)}/>
                                            </div>
                                            <div className="form-group">
                                                <div className="custom-control custom-checkbox small">
                                                    <input type="checkbox" className="custom-control-input" id="customCheck" />
                                                    <label className="custom-control-label" htmlFor="customCheck">Remember
                                                        Me</label>
                                                </div>
                                            </div>
                                            <button className="btn btn-md btn-primary btn-block" type="submit">Sign in</button>
                                        </form>
                                        <hr />
                                        <div className="text-center">
                                            <a className="small" href="/signup">Create an Account!</a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                                {(message.length>0) &&
                                <div className={'alert alert-danger'}>{message} {error}</div>
                                }
                        </div>
                    </div>
                </div>
            </div>
        </div>

        );
}



