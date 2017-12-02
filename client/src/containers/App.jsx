import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { BrowserRouter, Link, Switch, Route } from 'react-router-dom';
import {
  changeView,
  checkedIfLoggedIn,
  logout,
  goHome } from '../actions/index';
import PropTypes from 'prop-types';
// import Dashboard from '../components/Dashboard.jsx';
import FlashMessage from '../components/FlashMessage.jsx';
import Login from './Login.jsx';
import SignUp from './SignUp.jsx';
import Home from '../components/Home.jsx';
import Dashboard from '../components/Dashboard.jsx';
import PersonalInformation from '../components/PersonalInformation.jsx';
import PrivateRoute from './PrivateRoute.jsx';

class App extends Component {

  componentWillMount() {
    this.props.checkedIfLoggedIn();
  }

  renderFlashMessage() {
    if (this.props.flashMessage) {
      return <FlashMessage message={this.props.flashMessage.message} type={this.props.flashMessage.type} />
    } else {
      return;
    }
  }



  renderNav() {
    if(!this.props.users) {
      return (
        <div>
          <div className="nav-item nav-login">
            <Link to="/login">Log in</Link>
          </div>
          <div className="nav-item nav-signup">
            <Link to="/signup">Sign up</Link>
          </div>
        </div>
      );
    }
    return (
      <div>

        <div className="nav-item nav-dashboard">
          <Link to="/">Dashboard</Link>
        </div>

        <div className="nav-item nav-logout" onClick={() => { this.props.logout() }}>
          Log out
        </div>
      </div>
    );
  }

  render() {
    return (
      <BrowserRouter>
        <div className="app-container clear-fix">
          <div className="navbar clear-fix">
            <div className="nav-left">
              <div className="nav-item nav-logo">
                <i className="material-icons shiftly-icon">recent_actors</i>
                Aeon
              </div>
            </div>
            <div className="nav-right">
              { this.renderNav() }
            </div>
          </div>
          { this.renderFlashMessage() }

          <Switch>
            <Route exact path="/login" component={Login} />
            <Route exact path="/signup" component={SignUp} />
            <PrivateRoute exact path="/" component={Home} />
            <PrivateRoute exact path="/schedule" component={Dashboard} />
            <PrivateRoute exact path="/personal/information" component={PersonalInformation} />
          </Switch>

        </div>
      </BrowserRouter>
    );
  }
}

function mapStateToProps(state) {
  return {
    view: state.view,
    flashMessage: state.flashMessage,
    users: state.users,
    selectedWeek: state.selectedWeek,
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({
    checkedIfLoggedIn,
    changeView,
    logout,
    goHome,
  }, dispatch);
}

App.propTypes = {
  checkedIfLoggedIn: PropTypes.func.isRequired,
  changeView: PropTypes.func.isRequired,
  logout: PropTypes.func.isRequired,
  view: PropTypes.string.isRequired,
  flashMessage: PropTypes.objectOf(PropTypes.string),
  users: PropTypes.arrayOf(PropTypes.object),
  selectedWeek: PropTypes.string.isRequired,
};

export default connect(mapStateToProps, mapDispatchToProps)(App);
