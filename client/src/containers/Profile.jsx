import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import PropTypes from 'prop-types';
import { Button, Image } from 'react-bootstrap';
import { editProfile } from '../actions/index';


class Profile extends Component {
  constructor(props) {
    super(props);
    this.state = {
      emergencyContact: this.props.user.emergencyContact,
      address: this.props.user.address,
      email: this.props.user.email,
      phoneNumber: this.props.user.phoneNumber,
    };

    this.onChangeEC = this.onChangeEC.bind(this);
    this.onChangeAddress = this.onChangeAddress.bind(this);
    this.onChangeEmail = this.onChangeEmail.bind(this);
    this.onChangePhone = this.onChangePhone.bind(this);
  }

  onChangeEC(e) {
    this.setState({
      emergencyContact: e.target.value,
    });
  }

  onChangeAddress(e) {
    this.setState({
      address: e.target.value,
    });
  }

  onChangeEmail(e) {
    this.setState({
      email: e.target.value,
    });
  }

  onChangePhone(e) {
    this.setState({
      phoneNumber: e.target.value,
    });
  }


  render() {
    return (
      <div className="container mw-40 mh=60">
        <div className="row mw-100 mh-50 bg-primary border-0" >
          <Image className="text-hide" src="" circle />
        </div>
        <div className="col mw-100 mh-50 bg-faded border-0">
          <div className="container">
            <strong>Emergency Contact: </strong>
            <input className="credentials-input" id="emergencyContactP" type="text" name="emergencyContact" onChange={this.onChangeEC} value={this.state.emergencyContact} />
          </div>
          <div className="container">
            <strong>Address: </strong>
            <input className="credentials-input" id="addressP" type="text" name="address" value={this.state.address} onChange={this.onChangeAddress} />
          </div>
          <div className="container">
            <strong>Email: </strong>
            <input className="credentials-input" id="emailP" type="text" name="email" value={this.state.email} onChange={this.onChangeEmail} />
          </div>
          <div className="container">
            <strong>Phone: </strong>
            <input className="credentials-input" id="phoneNumberP" type="text" name="phoneNumber" value={this.state.phoneNumber} onChange={this.onChangePhone} />
          </div>
          <Button bsStyle="success" onClick={() => {
            let data = {
              name: this.props.user.name,
              emergencyContact: this.state.emergencyContact,
              address: this.state.address,
              email: this.state.email,
              phoneNumber: this.state.phoneNumber,
            };

            this.props.editProfile(data);
          }}>Edit Profile.</Button>
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    user: state.user,
  };
};

const mapDispatchToProps = (dispatch) => {
  return bindActionCreators({
    editProfile,
  }, dispatch);
};

export default connect(mapStateToProps, mapDispatchToProps)(Profile);
