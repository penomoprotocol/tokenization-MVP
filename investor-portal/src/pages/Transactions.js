import React, { useState, useEffect } from 'react';
import axios from 'axios';

import './Transactions.css'; // Ensure you have the CSS file

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true); // New loading state

  useEffect(() => {
    const fetchTransactions = async () => {
      const userToken = localStorage.getItem('authToken');
      try {
        const response = await axios.get(`${process.env.REACT_APP_PENOMO_API}/api/transactions/user/jwt`, {
          headers: { Authorization: `Bearer ${userToken}` }
        });
        setTransactions(response.data); 
      } catch (error) {
        console.error('Error fetching transactions:', error);
      } finally {
        setIsLoading(false); // Set loading to false after fetching data
      }
    };

    fetchTransactions();
  }, []);

  return (
    <div className="page-container">
      <h1 className="page-header">Transaction History</h1>
      <div className="section-container">
        {isLoading ? (
          <p>Loading...</p> // Display Loading message
        ) : transactions.length > 0 ? (
                <ul className="section-list">
                {[...transactions].reverse().map((transaction, index) => (
                    <li className="section-list-item" key={index} onClick={() => window.open(`https://sepolia.etherscan.io/tx/${transaction.hash}`, '_blank')}>
                        <strong>Date:</strong> {transaction.date}<br />
                        <strong>Type:</strong> {transaction.transactionType}<br />
                        {transaction.tokenSymbol && <><strong>Token:</strong> {transaction.tokenSymbol}<br /></>}
                        {transaction.tokenAmount && <><strong>Token Amount:</strong> {transaction.tokenAmount}<br /></>}
                        <strong>From:</strong> {transaction.from}<br />
                        <strong>To:</strong> {transaction.to}<br />
                        <strong>Transfered Amount:</strong> {transaction.payableAmount} {transaction.currency}<br />
                    </li>
                ))}
            </ul>
        ) : (
          <p>No transactions found.</p>
        )}
      </div>
    </div>
  );
};

export default Transactions;
