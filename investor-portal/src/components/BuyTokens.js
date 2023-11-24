import React, { useState } from 'react';
import axios from 'axios';

const BuyTokens = ({ token, closeModal, show }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [tokenAmount, setTokenAmount] = useState('');
  const [responseMessage, setResponseMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false); // New state to track form submission

  // Handle form submission for buying tokens
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true); // Enable the loading state

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
    } finally {
      setIsSubmitting(false); // Disable the loading state regardless of the outcome
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

  // Conditional styling for the Buy button
  const buyButtonClasses = isSubmitting ? "btn-penomo btn-disabled btn-center" : "btn-penomo btn-center";

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
              <label htmlFor="email" className="form-label"><strong>Email </strong></label>
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
              <label htmlFor="password" className="form-label"><strong>Password </strong></label>
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
              <label htmlFor="tokenAmount" className="form-label"> <strong>Amount to buy </strong></label>
              <input
                type="number"
                id="tokenAmount"
                className="form-control"
                value={tokenAmount}
                onChange={(e) => setTokenAmount(e.target.value)}
                required
              />
            </div>
            <div className="price-display horizontal-center">
              <strong>Token Price:&nbsp;</strong><span>{weiToEth(token.tokenPrice)} ETH</span>
            </div>
            <button type="submit" className={buyButtonClasses} disabled={isSubmitting}>
              {isSubmitting ? 'Mining Blocks...' : 'Buy'}
            </button>
          </form>
        ) : (
          <>
            <p className='content-center'>{responseMessage}</p>
            <button className="btn-penomo btn-center" onClick={handleClose}>OK</button>
          </>
        )}
      </div>
    </div>
  );
};

export default BuyTokens;
