import React, { useState } from 'react';
import axios from 'axios';
import { Modal } from 'react-bootstrap';
// import { Link } from 'react-router-dom';

const WithdrawWallet = ({ currency, closeModal, show,handleClose }) => {
  const [amount, setAmount] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const userToken = localStorage.getItem('authToken');

  // handleClose();

  const handleTransfer = async () => {
    if (status === 'pending') return;

    try {
      setStatus('pending');
      await axios.post(`${process.env.REACT_APP_PENOMO_API}/api/investor/transfer`, {
        amount,
        currency,
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

  return (
    <Modal show={show} onHide={closeModal} centered>
      <Modal.Header closeButton>
        <Modal.Title>Withdraw Wallet</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <input
          type="number"
          className="form-control"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <input
          type="text"
          className="form-control"
          placeholder="To: Wallet Address"
          value={walletAddress}
          onChange={(e) => setWalletAddress(e.target.value)}
        />
        {error && <div className="alert alert-danger" role="alert">{error}</div>}
      </Modal.Body>
      <Modal.Footer>
        {/* //TODO: Need to add a Close Button After Transfer of Token is Succesful */}
      {/* <Link className="btn-secondary-navbar" onClick={handleClose}>
          Close
        </Link> */}
        <button className={`btn-penomo ${status === 'pending' ? 'btn-penomo-secondary' : ''}`}
                onClick={handleTransfer}>
          {status === 'pending' ? 'Mining blocks...' : status === 'complete' ? 'Transfer complete.' : 'Transfer'}
        </button>
      </Modal.Footer>
    </Modal>
  );
};

export default WithdrawWallet;
