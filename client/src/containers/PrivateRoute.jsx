import React from 'react';
import { connect } from 'react-redux';
import { Route, Redirect } from 'react-router-dom';

const PrivateRoute = ({ component, ...rest }) => (
  <Route {...rest} render={ props => (
    rest.users ? 
      React.createElement(component) :
      <Redirect to="/login" />
  ) } />
)

function mapStateToProps(state) {
  return { users: state.users, }
};

export default connect(mapStateToProps, null)(PrivateRoute);
