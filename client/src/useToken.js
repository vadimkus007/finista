import { useState } from 'react';

function isJSONString(str) {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}

export default function useToken() {
  const getToken = () => {
    const tokenString = localStorage.getItem('token');
    if (isJSONString(tokenString)) {
        const userToken = JSON.parse(tokenString);
        return userToken?.token;
    } else {
        return null;
    }
    // const userToken = JSON.parse(tokenString);
    // return userToken?.token
  };

  const [token, setToken] = useState(getToken());

  const saveToken = userToken => {
    localStorage.setItem('token', JSON.stringify(userToken));
    setToken(userToken.token);
  };

  return {
    setToken: saveToken,
    token
  }
}