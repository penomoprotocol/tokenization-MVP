import React, { useState } from 'react';
import axios from 'axios';

const BuyTokens = ({ token, closeModal, show }) => {
  const [tokenAmount, setTokenAmount] = useState('');
  const [responseMessage, setResponseMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const userToken = localStorage.getItem('authToken');

    try {
      if (!token.serviceContractAddress) {
        throw new Error("Service contract address is not available.");
      }

      const response = await axios.post(`${process.env.REACT_APP_PENOMO_API}/api/investor/buyToken`, {
        tokenAmount: tokenAmount,
        serviceContractAddress: token.serviceContractAddress,
        currency: token.acceptedCurrency, // Include the currency in the request
      }, {
        headers: { Authorization: `Bearer ${userToken}` }
      });

      setResponseMessage(response.data.message);
    } catch (error) {
      setResponseMessage(error.response ? error.response.data : 'Failed to purchase tokens.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setResponseMessage('');
    closeModal();
  };

  function roundToDecimals(str, x) {
    let num = parseFloat(str);
    if (isNaN(num)) {
        return 'Invalid input'; // Handle the error as needed
    }
    // Check if the number is less than 1 and not an integer
    if (num < 1 && num % 1 !== 0) {
        let num_mul = num;
        let decimalPlaces = 0;
        while (num_mul < 1) {
            num_mul = num_mul*10
            decimalPlaces = decimalPlaces+1
        }
        // Ensure at least two significant digits after zeros
        const totalDigits = decimalPlaces + 1;
        return num.toFixed(Math.max(totalDigits, x));
    } else {
        return num.toFixed(x); // Round to x decimal places
    }
}

  // const weiToEth = (wei) => {
  //   const eth = wei / 1e18;
  //   return parseFloat(eth.toFixed(3));
  // };

  const buyButtonClasses = isSubmitting ? "btn-penomo btn-disabled btn-center" : "btn-penomo btn-center";

  if (!show) {
    return null;
  }

  const tokenPriceDisplay = token.currency === 'USDC' ? `${roundToDecimals(token.tokenPrice,2)} USDC` : `${roundToDecimals(token.tokenPrice,2)} ETH`;

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
              <label htmlFor="tokenAmount" className="form-label"><strong>Token Amount:</strong></label>
              <input
                type="number"
                id="tokenAmount"
                className="form-control"
                value={tokenAmount}
                onChange={(e) => setTokenAmount(e.target.value)}
                required
              />
            </div>
            <div className="horizontal-center price-display margin-bottom-2rem">
              <strong>Token Price:&nbsp;</strong><span>{tokenPriceDisplay}</span>
            </div>
            <div className="horizontal-center price-display margin-bottom-2rem">
              <strong>Transferable Amount:&nbsp;</strong><span>{roundToDecimals(tokenAmount*tokenPriceDisplay,2)}</span>
            </div>
            <div className='horizontal-center'>
              <button type="submit" className={buyButtonClasses} disabled={isSubmitting}>
                {isSubmitting ? 'Processing...' : 'Buy'}
              </button>
            </div>
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
