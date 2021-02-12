const SERVER_URL = 'http://localhost:3001/api';

export function getRequest(endPoint) {
    const API_URL = SERVER_URL + endPoint;

    return fetch(API_URL, {
        method: 'GET'
    })
    .then(response => response.json());
}