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
import Preferences from './pages/Preferences/Preferences';
import UserProfile from './pages/UserProfile';
import Quotes from './pages/Quotes';
import Quote from './pages/Quote';
import Logout from './components/Logout';
import NotFound from './pages/NotFound';
import Portfolios from './pages/Portfolios';
import PortfolioEdit from './pages/PortfolioEdit';
import Trades from './pages/Trades';
import TradeEdit from './pages/TradeEdit';
import Rebalance from './pages/Rebalance';
import Goals from './pages/Goals';
import Actives from './pages/Actives';
import Analytics from './pages/Analytics';
import Profit from './pages/Profit';

import PrivateRoute from './routes/PrivateRoute';

import DefaultLayout from './layouts/DefaultLayout';
import AuthLayout from './layouts/AuthLayout';

import { history } from './helpers';
// import { authenticationService } from './services';

// Notification container
import 'react-notifications/lib/notifications.css';
import { NotificationContainer } from 'react-notifications';

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
                        <Route path="/quotes/:secid" component={Quote} />
                        <Route exact path="/dashboard" component={Dashboard} />
                        <PrivateRoute exact path="/portfolios" component={Portfolios} />
                        <PrivateRoute exact path="/portfolios/edit" component={PortfolioEdit} />
                        <PrivateRoute exact path="/portfolio/actives" component={ Actives } />
                        <PrivateRoute exact path="/portfolio/trades" component={Trades} />
                        <PrivateRoute exact path="/portfolio/trades/edit" component={TradeEdit} />
                        <PrivateRoute exact path="/portfolio/rebalance" component={ Rebalance } />
                        <PrivateRoute exact path="/portfolio/rebalance/goals" component={ Goals } />
                        <PrivateRoute exact path="/portfolio/profit" component={ Profit } />
                        <PrivateRoute exact path="/portfolio/analytics" component={ Analytics } />
                        <PrivateRoute exact path="/preferences" component={Preferences} />
                        <PrivateRoute exact path="/user" component={UserProfile} />
                        <Route component={NotFound} />
                    </Switch>
                </DefaultLayout>
            </Route>

            </Switch>
            <NotificationContainer />
        </Router>
    );
}

export default App;
