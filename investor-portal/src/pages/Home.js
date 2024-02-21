import React from 'react';
import homeImg from '../assets/home_fade.png'; // Make sure the path is correct

const Home = () => {
  return (
    <div
      className="home-page-container"
      style={{
        backgroundImage: `url(${homeImg})`,
        backgroundSize: '90vw auto', // Scales the width to 80% of the viewport width, height is auto to maintain aspect ratio
        backgroundPosition: 'center', // Keeps the image centered both vertically and horizontally
        minHeight: '180vh', // Adjust as needed for your design
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundRepeat: 'no-repeat',
      }}
    >
  

      <div className="hero-section" style={{ marginTop: '4rem', padding: '8rem', backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
        <h1 className="section-header">Invest in Energy, Empower the Future</h1>
        <h5>penomo democratizes investment in energy infrastructure, enabling you to directly own a stake and earn revenue from sustainable energy projects.</h5>
        <h5>Start investing in a future that pays back — to you and the planet.</h5>
      </div>
    </div>
  );
};

export default Home;
