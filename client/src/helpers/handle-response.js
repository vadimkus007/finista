import { authenticationService } from '../services';
// import { useLocation } from 'react-router-dom';



export function handleResponse(response) {

    // const [myLocation, setMyLocation] = useLocation();

    return response.text().then(text => {
        const data = text && JSON.parse(text);
        if (!response.ok) {
            if ([401, 403].indexOf(response.status) !== -1) {
                // auto logout if 401 Unauthorized or 403 Forbidden response returned from api
                authenticationService.logout();
                //myLocation.reload(true);
            }

            const error = (data && data.message) || response.statusText;
            return Promise.reject(error);
        }

        return data;
    });
}