import React from 'react';
import logo from '../assets/penomo_logo.svg'; // Make sure the path is correct

const Home = () => {
  return (
    <div className="page-container">
      <div style={{ textAlign: 'left' }}>
        <h1 className="page-header">
          <img src={logo} alt="Penomo Logo" style={{ width: '20rem', height: 'auto', margin:'auto' }} />
        </h1>
      </div>

      {/* Hero section */}
      <div className="page-container">
        <h1 className="section-header">Invest in Energy, Empower the Future</h1>
        <p>Penomo democratizes investment in energy infrastructure, enabling you to directly own a stake and earn revenue from sustainable energy projects. Start investing in a future that pays back — to you and the planet.</p>
      </div>
    </div>
  );
};

export default Home;
