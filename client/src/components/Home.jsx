import React from 'react';
import { Link } from 'react-router-dom';


const Home = () => (
  <div>
    <div className="home-button">
      <div className="child">
        <Link to="/schedule">Schedule</Link>
      </div>
    </div>
    <div className="home-button">
      <div className="child">
        <Link to="/personal/information">Personal Information</Link>
      </div>
    </div>
  </div>
);

export default Home;

