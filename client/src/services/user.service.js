// import config from 'config';
import { authHeader, handleResponse } from '../helpers';

export const userService = {
    getAll
};

function getAll() {
    const requestOptions = { method: 'GET', headers: authHeader() };
    return fetch(`http://localhost:3001/api/user`, requestOptions).then(handleResponse);
}