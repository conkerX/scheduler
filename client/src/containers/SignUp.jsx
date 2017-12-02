import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import PropTypes from 'prop-types';
import { signUp } from '../actions/index';
import { Redirect } from 'react-router-dom';

class SignUp extends Component {
  constructor(props) {
    super(props);
    this.state = {
      role: 'employee',
    };
  }

  render() {
    return (
      this.props.users ?
        <Redirect to="/" /> :

        <div className="credentials clear-fix">
          <h4>Sign Up</h4>
          <form >
            <div>
              <label className="credentials-label">Username:</label>
              <input className="credentials-input" id="username" type="text" name="username" />
            </div>

            <div>
              <label className="credentials-label">Password:</label>
              <input className="credentials-input" id="password" type="password" name="password" />
            </div>

            <div>
              <label className="credentials-label">Role:</label>
              <input onChange={this.radioHandler} name="role" type="radio" value="employee" checked="checked" />Employee
              <input onChange={this.radioHandler} name="role" type="radio" value="manager" />Manager
            </div>

            <div>
              <label className="credentials-label">Emergency Contact:</label>
              <input className="credentials-input" id="emergencyContact" type="text" name="emergencyContact" />
            </div>

            <div>
              <label className="credentials-label">Address:</label>
              <input className="credentials-input" id="address" type="text" name="address" />
            </div>

            <div>
              <label className="credentials-label">Email:</label>
              <input className="credentials-input" id="email" type="email" name="email" />
            </div>

            <div>
              <label className="credentials-label">Phone Number:</label>
              <input className="credentials-input" id="phoneNumber" type="tel" name="phoneNumber" />
            </div>

            <div className="btn-credentials">
              <input className="btn-main clickable" type="button" value="Sign Up" onClick={
                () => {
                  let username = document.getElementById('username').value;
                  let password = document.getElementById('password').value;
                  let role = this.state.role;
                  let emergencyContact = document.getElementById('emergencyContact').value;
                  let address = document.getElementById('address').value;
                  let email = document.getElementById('email').value;
                  let phoneNumber = document.getElementById('phoneNumber').value;

                  this.props.signUp({ username, role, password, emergencyContact, email, address, phoneNumber });

                  document.getElementById('username').value = '';
                  document.getElementById('password').value = '';
                  this.state.role = 'employee';
                  document.getElementById('emergencyContact').value = '';
                  document.getElementById('address').value = '';
                  document.getElementById('email').value = '';
                  document.getElementById('phoneNumber').value = '';
                }
              }
              />
            </div>
          </form>
        </div>
      
    );
  }
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({ signUp }, dispatch);
}

function mapStateToProps(state) {
  return { users: state.users };
}

SignUp.propTypes = {
  signUp: PropTypes.func.isRequired,
  users: PropTypes.arrayOf(PropTypes.object),
};
export default connect(mapStateToProps, mapDispatchToProps)(SignUp);
