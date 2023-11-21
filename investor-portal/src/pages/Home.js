import React from 'react';

// Import styling
import './Home.css';


const Home = () => {
  return (
    <div className="home">
      <h1>Welcome to the Investor Portal</h1>
      <p>Explore investment opportunities, manage your assets, and track your transaction history all in one place.</p>
      
      {/* Additional content can go here */}
      <section>
        <h2>Why Choose Us?</h2>
        <p>Discover the benefits of our comprehensive investment platform.</p>
        {/* More descriptive content */}
      </section>

      <section>
        <h2>Get Started</h2>
        <p>Join our community of investors and start building your portfolio today.</p>
        {/* Call-to-action or informational content */}
      </section>
    </div>
  );
};

export default Home;

