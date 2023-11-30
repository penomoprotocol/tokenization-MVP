import React, { useState, useContext } from 'react';
import axios from 'axios';
import './WithdrawWallet.css'; // Ensure you have the CSS file

const WithdrawWallet = ({ closeModal, show }) => {
  const [amount, setAmount] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [status, setStatus] = useState('idle'); // 'idle', 'pending', 'complete'
  const [error, setError] = useState('');
  const userToken = localStorage.getItem('authToken');

  const handleTransfer = async () => {
    if (status === 'pending') return; // Prevent double submission

    try {
      setStatus('pending');
      const response = await axios.post(`${process.env.REACT_APP_PENOMO_API}/api/investor/transfer`, {
        amount,
        walletAddress
      }, {
        headers: { Authorization: `Bearer ${userToken}` }
      });

      setStatus('complete');
    } catch (error) {
      setError('Failed to transfer funds.');
      setStatus('idle');
    }
  };

  const handleClose = () => {
    closeModal();
    setStatus('idle'); // Reset status on close
  };

  if (!show) {
    return null;
  }

  return (
    <div className="popup">
      <div className="popup-content">
        <div className="popup-header">
          <h2>Withdraw Wallet</h2>
        </div>
        <div>
          <input
            type="number"
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <input
            type="text"
            placeholder="Wallet Address"
            value={walletAddress}
            onChange={(e) => setWalletAddress(e.target.value)}
          />
        </div>
        {error && <div className="alert alert-danger" role="alert">{error}</div>}
        <button
          className={`btn-penomo ${status === 'pending' ? 'btn-penomo-secondary' : ''}`}
          onClick={handleTransfer}
        >
          {status === 'pending' ? 'Mining blocks...' : status === 'complete' ? 'Transfer complete.' : 'Transfer'}
        </button>
        {status === 'complete' && (
          <button className="btn-penomo btn-center" onClick={handleClose}>OK</button>
        )}
      </div>
    </div>
  );
};

export default WithdrawWallet;
