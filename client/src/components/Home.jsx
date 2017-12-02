import React from 'react';
import { Link } from 'react-router-dom';


const Home = () => (
  <div>
    <button>
      <Link to="/schedule">Schedule</Link>
    </button>
    <button>
      <Link to="/personal/information">Personal Information</Link>
    </button>
  </div>
);

export default Home;

