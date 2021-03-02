import { authHeader } from '../helpers';

const SERVER_URL = 'http://localhost:3001/api';


export function getRequest(endPoint) {
    const API_URL = SERVER_URL + endPoint;

    const requestOptions = { method: 'GET', headers: authHeader() };
    
    return fetch(API_URL, requestOptions)
    .then(response => response.json());
}

export function postRequest(endPoint, body) {
    const API_URL = SERVER_URL + endPoint;

    var requestOptions = { method: 'POST', headers: authHeader(), body: JSON.stringify(body) };
    requestOptions.headers['Content-Type'] = 'application/json';
    requestOptions.headers['Accept'] = 'application/json';
    return fetch(API_URL, requestOptions)
    .then(response => response.json());
}

export function postFile(endPoint, body) {
    const API_URL = SERVER_URL + endPoint;

    var requestOptions = { method: 'POST', headers: authHeader(), body: body };
    // requestOptions.headers['Content-Type'] = 'application/x-www-form-urlencoded';
    requestOptions.headers['Accept'] = 'application/json';
    return fetch(API_URL, requestOptions)
    .then(response => response.json());
}