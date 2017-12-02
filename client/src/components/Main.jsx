import React from 'react';
import { BrowserRouter, Switch, Route } from 'react-router-dom';
import Dashboard from './Dashboard.jsx';
import PersonalInformation from './PersonalInformation.jsx';
import Home from './Home.jsx';

// The Main component renders one of the two provided
// Routes (provided that one matches). The /schedule
// route will match any pathname that starts
// with /schedule. The / route will only match
// when the pathname is exactly the string "/"
const Main = () => (
  <div>
    <BrowserRouter>
      <Switch>
        <Route exact path="/dashboard" component={Home} />
        <Route exact path="/schedule" component={Dashboard} />
        <Route exact path="/personal/information" component={PersonalInformation} />
      </Switch>
    </BrowserRouter>
  </div>
)

// <Route exact path="/" component={Home} />
export default Main;
