// import config from 'config';
import { authHeader, handleResponse } from '../helpers';

import config from '../config/config.json';

const SERVER_URL = config.SERVER_URL;

export const userService = {
    getAll
};

function getAll() {
    const requestOptions = { method: 'GET', headers: authHeader() };
    return fetch(`${ SERVER_URL }/user`, requestOptions).then(handleResponse);
}