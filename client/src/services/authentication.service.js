import { BehaviorSubject } from 'rxjs';

// import config from 'config';
// import { handleResponse } from '../helpers';

const currentUserSubject = new BehaviorSubject(JSON.parse(localStorage.getItem('currentUser')));

export const authenticationService = {
    signin,
    logout,
    currentUser: currentUserSubject.asObservable(),
    get currentUserValue () { return currentUserSubject.value }
};

function signinUser(email, password) {
    return fetch('http://localhost:3001/api/signin', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json', 
            'Accept': 'application/json'
        },
        body: JSON.stringify({email, password})
    })
    .then(data => data.json());
}

function signin(email, password) {

    return new Promise((resolve, reject) => {
        signinUser(email, password)
        .then(response => {
            if (response.token) {
                localStorage.setItem('currentUser', JSON.stringify(response));
                currentUserSubject.next(response);
            }
            resolve(response);
        })
        .catch(error => reject(error));
    });

}

function logout() {
    // remove user from local storage to log user out
    localStorage.removeItem('currentUser');
    currentUserSubject.next(null);
}
