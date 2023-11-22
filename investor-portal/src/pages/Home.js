import React from 'react';


const Home = () => {
  return (
    <div className="page-container">
      <h1 className="page-header">penomo Investor Portal</h1>
      {/* Hero section */}
      <div className="section-container">
        <h1 className="section-header">Invest in Energy, Empower the Future</h1>
        <p>Penomo democratizes investment in energy infrastructure, enabling you to directly own a stake and earn revenue from sustainable energy projects. Start investing in a future that pays back — to you and the planet.</p>
      </div>

      {/* Advantages for investors */}
      <section className="section-container">
        <h2 className="section-header">Open Doors to Green Investments</h2>
        <p>Remove barriers to entry in the energy sector. With Penomo, enjoy the freedom to invest in high-potential projects across the globe, previously accessible only to large investors.</p>
      </section>

      <section className="section-container">
        <h2 className="section-header">Earn As You Support Sustainability</h2>
        <p>Contribute to net-zero targets while receiving your share of the revenues. By investing with Penomo, you support the growth of clean energy and share in the financial returns of eco-friendly power generation.</p>
      </section>

      <section className="section-container">
        <h2 className="section-header">Diversify Your Portfolio</h2>
        <p>Diversify beyond traditional stocks and bonds. Energy tokens offer a unique addition to your investment mix, backed by the tangible value of energy assets and their revenue streams.</p>
      </section>

      <section className="section-container">
        <h2 className="section-header">Invest with Impact</h2>
        <p>Your investment powers more than just financial gains. It drives the transition to sustainable energy solutions, building a resilient grid and a cleaner world for future generations.</p>
      </section>

      {/* Call to action */}
      <section className="section-container">
        <h2 className="section-header">Join the Penomo Community</h2>
        <p>Take the first step towards impactful investing. Join a community of forward-thinkers who see beyond the horizon. Invest with Penomo — where every dollar accelerates the journey to net zero.</p>
        {/* Insert a call-to-action button if needed */}
      </section>
    </div>
  );
};

export default Home;
