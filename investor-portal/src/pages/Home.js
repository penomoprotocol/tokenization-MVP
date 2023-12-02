import React from 'react';
import logo from '../assets/penomo_logo.svg'; // Make sure the path is correct
import homeImg from '../assets/home_fade.png'; // Make sure the path is correct

const Home = () => {
  return (
    <div
      className="home-page-container"
      style={{
        backgroundImage: `url(${homeImg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center top', // This will align the image to the top
        minHeight: '250vh', // You might want to change this back to 100vh if it's too tall
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >

      <div className="hero-section" style={{ marginTop: '8rem', padding: '4rem', backgroundColor: 'rgba(255, 255, 255, 0.5)' }}>
        <h1 className="section-header">Invest in Energy, Empower the Future</h1>
        <p>Penomo democratizes investment in energy irastructure, enabling you to directly own a stake and earn revenue from sustainable energy projects. Start investing in a future that pays back — to you and the planet.</p>
      </div>
    </div>
  );
};

export default Home;
