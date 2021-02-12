import React from 'react';

import './App.css';
import { 
  BrowserRouter as Router, 
  Route, 
  Switch
} from 'react-router-dom';

import Home from './pages/Home';
import Signin from './pages/Signin';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard/Dashboard';
import Preferences from './components/Preferences/Preferences';
import UserProfile from './pages/UserProfile';
import Quotes from './pages/Quotes';
import Logout from './components/Logout';
import NotFound from './pages/NotFound';
import PrivateRoute from './routes/PrivateRoute';

import DefaultLayout from './layouts/DefaultLayout';
import AuthLayout from './layouts/AuthLayout';

import { history } from './helpers';
// import { authenticationService } from './services';

function App(props)  {

    // sidebar toggle
    // const [toggled, setToggled] = useState(true);

    // const [currentUser, setCurrentUser] = useState(null);

    // const token = getToken();
    //const { token, setToken } = useToken();

/*
    if(!token) {
        return <Signin setToken = {setToken} />
    }
*/

    
//    authenticationService.currentUser.subscribe(currentUser);

    return (
        <Router history={history}>
            <Switch>
            <Route path={['/logout', '/signup', '/signin']}>
                <AuthLayout>          
                    <Switch>
                        <Route exact path="/logout" component={Logout} />
                        <Route exact path="/signup" component={Signup} />
                        <Route exact path="/signin" component={Signin} />
                    </Switch>
                </AuthLayout>
            </Route>

            <Route path={['/', '/dashboard', '/preferences']}>
                <DefaultLayout>
                    <Switch>
                        <Route exact path="/" component={Home} />
                        <Route exact path="/quotes" component={Quotes} />
                        <Route exact path="/dashboard" component={Dashboard} />
                        <PrivateRoute exact path="/preferences" component={Preferences} />
                        <PrivateRoute exact path="/user" component={UserProfile} />
                        <Route component={NotFound} />
                    </Switch>
                </DefaultLayout>
            </Route>

            </Switch>
        </Router>
    );
}

export default App;
