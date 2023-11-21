import React, { useState } from 'react';


const BuyTokens = ({ project, closeModal, show }) => {
  const [amount, setAmount] = useState('');

  // Handle form submission for buying tokens
  const handleSubmit = (e) => {
    e.preventDefault();
    // Proceed with the API call to buy tokens
    // After success, close the modal
    closeModal();
  };

  if (!show) {
    return null;
  }

  return (
    <div className="modal">
      <div className="modal-content">
        <span className="close" onClick={closeModal}>&times;</span>
        <h2>Buy Tokens for {project.name}</h2>
        <form onSubmit={handleSubmit}>
          <label htmlFor="amount">Amount to buy:</label>
          <input
            type="number"
            id="amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <p>Current Price per Token: {project.tokenPrice}</p>
          <button type="submit" className="btn">Buy</button>
        </form>
      </div>
      <button onClick={closeModal}>Close</button>
    </div>
  );
};

export default BuyTokens;