import React, { useState } from 'react';
import PropTypes from 'prop-types';
import './signin.css';

async function signinUser(credentials) {
 return fetch('http://localhost:3001/api/signin', {
      method: 'POST',
//      mode: 'cors',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
//      credentials: 'include',
      body: JSON.stringify(credentials)
    })
    .then(data => data.json());
}

export default function Signin({ setToken }) {

  const [email, setEmail] = useState();
  const [password, setPassword] = useState();

  const handleSubmit = async e => {
    e.preventDefault();

    var token = await signinUser({
      email,
      password
    });
  
    setToken(token);

  }

  return(
    <div className="signin-wrapper">
    <h1>Please signin</h1>
    <form onSubmit={handleSubmit}>
      <label>
        <p>Email</p>
        <input type="email" onChange={e => setEmail(e.target.value)} />
      </label>
      <label>
        <p>Password</p>
        <input type="password" onChange={e => setPassword(e.target.value)} />
      </label>
      <div>
        <button type="submit">Submit</button>
      </div>
    </form>
    </div>
  )
}

Signin.propTypes = {
  setToken: PropTypes.func.isRequired
}