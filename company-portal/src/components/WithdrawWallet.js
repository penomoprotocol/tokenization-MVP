import React, { useState } from 'react';
import axios from 'axios';
import { Modal } from 'react-bootstrap';

const WithdrawWallet = ({ currency, closeModal, show, bankAccount }) => {
  const [amount, setAmount] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [withdrawalMethod, setWithdrawalMethod] = useState('bank');
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const [transferSuccess, setTransferSuccess] = useState(false);
  const userToken = localStorage.getItem('authToken');

  const handleTransfer = async () => {
    if (status === 'pending') return;

    setStatus('pending');
    setError('');

    if (withdrawalMethod === 'bank') {
      // Immediately show the success message for "To Bank" transfers
      setTransferSuccess(true);
      setStatus('idle'); // Reset the status

      // Transfer funds to burning contract / treasury
      const payload = {
        amount,
        currency,
        walletAddress: process.env.REACT_APP_BURNING_ADDRESS,
      };

      await axios.post(`${process.env.REACT_APP_PENOMO_API}/api/company/transfer`, payload, {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      
    } else {
      // Proceed with the transfer process for "To Wallet" transfers
      try {
        const payload = {
          amount,
          currency,
          walletAddress
        };

        await axios.post(`${process.env.REACT_APP_PENOMO_API}/api/company/transfer`, payload, {
          headers: { Authorization: `Bearer ${userToken}` }
        });

        setStatus('complete');
      } catch (error) {
        setError('Failed to transfer funds.');
        setStatus('idle');
      }
    }
  };

  const handleCloseModal = () => {
    closeModal();
    setTransferSuccess(false);
    setStatus('idle');
    setError('');
  };

  return (
    <Modal show={show} onHide={handleCloseModal} centered>
      <Modal.Header closeButton>
        <Modal.Title>Withdraw Funds</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {transferSuccess ? (
          <center>The funds are on the way!</center>
        ) : (
          <>
            <div className="toggle-buttons">
              <button
                className={`toggle-button ${withdrawalMethod === 'bank' ? 'active' : ''}`}
                onClick={() => setWithdrawalMethod('bank')}
              >
                To Bank
              </button>
              <button
                className={`toggle-button ${withdrawalMethod === 'wallet' ? 'active' : ''}`}
                onClick={() => setWithdrawalMethod('wallet')}
              >
                To Wallet
              </button>
            </div>

            {withdrawalMethod === 'wallet' && (
              <input
                type="text"
                className="form-control"
                placeholder="To: Wallet Address"
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
              />
            )}
            {withdrawalMethod === 'bank' && !bankAccount && (
              <p>Please add your bank details in the settings.</p>
            )}
            {withdrawalMethod === 'bank' && bankAccount && (
              <center><p>This will transfer the amount to your bank account: <strong>{bankAccount}</strong>.</p></center>
            )}
            <input
              type="number"
              className="form-control"
              placeholder="Amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            {error && <div className="alert alert-danger" role="alert">{error}</div>}
          </>
        )}
      </Modal.Body>
      <Modal.Footer>
        {transferSuccess || status === 'complete' ? (
          <button className="btn-penomo" onClick={handleCloseModal}>
            Okay
          </button>
        ) : (
          <button
            className={`btn-penomo ${status === 'pending' ? 'btn-penomo-secondary' : ''}`}
            onClick={handleTransfer}
            disabled={status === 'pending' || !amount}
          >
            {status === 'pending' ? 'Processing...' : 'Transfer'}
          </button>
        )}
      </Modal.Footer>
    </Modal>
  );
};

export default WithdrawWallet;
