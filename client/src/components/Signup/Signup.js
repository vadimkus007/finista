import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import FormErrors from '../FormErrors';
import { authenticationService } from '../../services';


export default function Signup(props) {

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [first_name, setFirstName] = useState('');
    const [last_name, setLastName] = useState('');
    const [formErrors, setFormErrors] = useState({email: '', password: ''});
    const [emailValid, setEmailValid] = useState(false);
    const [passwordValid, setPasswordValid] = useState(false);
    const [formValid, setFormValid] = useState(false);

    const history = useHistory();

    const handleUserInput = (e) => {
        const name = e.target.name;
        const value = e.target.value;
        if (name === 'first_name') {setFirstName(value)};
        if (name === 'last_name') {setLastName(value)};
        if (name === 'email') {setEmail(value)};
        if (name === 'password') {setPassword(value)};

        validateField(name, value);
    }

    const validateField = (fieldName, value) => {
        let fieldValidationErrors = formErrors;
        let newEmailValid = emailValid;
        let newPasswordValid = passwordValid;

        switch (fieldName) {
            case 'email':
                newEmailValid = value.match(/^([\w.%+-]+)@([\w-]+\.)+([\w]{2,})$/i) ? true : false;
                fieldValidationErrors.email = newEmailValid ? '' : ' is invalid';
                break;
            case 'password':
                newPasswordValid = value.length >= 1;
                fieldValidationErrors.password = newPasswordValid ? '': ' is too short';
                break;
            default:
                break;
        }
        setFormErrors(fieldValidationErrors);
        setEmailValid(newEmailValid);
        setPasswordValid(newPasswordValid);
        validateForm();

        function validateForm() {
            setFormValid(emailValid && passwordValid);
        }
    }

    function signupUser(user) {
        const API_URL = 'http://localhost:3001/api/signup';
        return fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(user)
        })
        .then(result => result.json());
    }

    const handleSubmit = e => {
        e.preventDefault();

        signupUser({email: email, password: password, first_name: first_name, last_name: last_name})
        .then(response => {
            if (response.user) {
                return authenticationService.signin(email, password);
            }
        })
        .then(user => {
            if (user.user) {
                history.push('/');
            } else {
                setFormErrors({error: user.message});
            }
        })
        .catch(err => {
            setFormErrors({error: err});
        });

    }

    return (
        <div className="container">
            <div className="card o-hidden border-0 shadow-lg my-5">
                <div className="card-body p-0">
                    <div className="row">
                        <div className="col-lg-5 d-none d-lg-block bg-register-image"></div>
                        <div className="col-lg-7">
                            <div className="p-5">
                                <div className="text-center">
                                    <h1 className="h4 text-gray-900 mb-4">Create an Account!</h1>
                                </div>
                                <form className="user" id="signup" name="signup" method="post" onSubmit={handleSubmit}>
                                    <div className="form-group row">
                                        <div className="col-sm-6 mb-3 mb-sm-0">
                                            <input type="text" className="form-control form-control-user" id="exampleFirstName"
                                                placeholder="First Name" name="first_name" value={first_name} onChange={handleUserInput} />
                                        </div>
                                        <div className="col-sm-6">
                                            <input type="text" className="form-control form-control-user" id="exampleLastName"
                                                placeholder="Last Name" name="last_name" value={last_name} onChange={handleUserInput} />
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <input type="email" className="form-control form-control-user" id="exampleInputEmail"
                                            placeholder="Email Address" name="email" value={email} onChange={handleUserInput} required="required" />
                                    </div>
                                    <div className="form-group row">
                                        <input type="password" className="form-control form-control-user"
                                            id="exampleInputPassword" placeholder="Password" name="password" value={password} onChange={handleUserInput} required="required" />
                                    </div>
                                    <button className="btn btn-md btn-primary btn-block" type="submit" disabled={!formValid}>Регистрация</button>
                                </form>
                                <hr />
                                <div className="text-center">
                                    <a className="small" href="/signin">Already have an account? Login!</a>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="panel panel-default alert-danger">
                        <FormErrors formErrors={formErrors} />
                    </div>
                </div>
            </div>
        </div>
    );
}