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
  

      <div className="hero-section" style={{ marginTop: '8rem', padding: '4rem', backgroundColor: 'rgba(255, 255, 255, 0.5)' }}>
        <h1 className="section-header">Get liquidity for your renewable energy assets - Fast and and debt-free</h1>
        <p>penomo democratizes investment in energy infrastructure, enabling investors to directly own a stake and earn revenue from sustainable energy projects.</p>
      </div>
    </div>
  );
};

export default Home;
