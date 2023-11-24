import React, { useState } from 'react';
import axios from 'axios';

const BuyTokens = ({ token, closeModal, show }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [tokenAmount, setTokenAmount] = useState('');
  const [responseMessage, setResponseMessage] = useState('');

  // Handle form submission for buying tokens
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post(`${process.env.REACT_APP_PENOMO_API}/api/investor/buyToken`, {
        investorEmail: email,
        password: password,
        tokenAmount: tokenAmount,
        serviceContractAddress: token.serviceContractAddress,
      });

      // Display response message
      setResponseMessage(response.data.message);
    } catch (error) {
      setResponseMessage(error.response ? error.response.data : 'Failed to purchase tokens.');
    }
  };

  // Close modal and clear message
  const handleClose = () => {
    setResponseMessage('');
    closeModal();
  };

  const weiToEth = (wei) => {
    const eth = wei / 1e18; // Convert wei to ETH
    const ethString = eth.toString();

    // Find the position of the first non-zero digit after the decimal
    const firstNonZero = ethString.indexOf('.') + 1 + ethString.substring(ethString.indexOf('.') + 1).search(/[1-9]/);

    // Use toPrecision with the position of the first non-zero digit + 2 for two decimal places
    return eth.toPrecision(firstNonZero - 2);
  };


  if (!show) {
    return null;
  }

  return (
    <div className="popup">
      <div className="popup-content">
        <div className="popup-header">
          <span className="close" onClick={handleClose}>&times;</span>
          <h2>Buy Tokens for {token.name}</h2>
        </div>
        {!responseMessage ? (
          <form onSubmit={handleSubmit} className="token-purchase-form">
            <div className="form-group">
              <label htmlFor="email" className="form-label">Email:</label>
              <input
                type="email"
                id="email"
                className="form-control"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="password" className="form-label">Password:</label>
              <input
                type="password"
                id="password"
                className="form-control"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="tokenAmount" className="form-label">Amount to buy:</label>
              <input
                type="number"
                id="tokenAmount"
                className="form-control"
                value={tokenAmount}
                onChange={(e) => setTokenAmount(e.target.value)}
                required
              />
            </div>
            <div className="price-display">
              <strong>Current Price per Token:</strong> <span>{weiToEth(token.tokenPrice)} ETH</span>
            </div>
            <button type="submit" className="btn-penomo">Buy</button>
          </form>
        ) : (
          <>
            <p>{responseMessage}</p>
            <button onClick={handleClose}>OK</button>
          </>
        )}
      </div>
    </div>
  );
};

export default BuyTokens;
