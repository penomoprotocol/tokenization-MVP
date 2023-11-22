import React, { useState, useEffect } from 'react';
import axios from 'axios';

import './Transactions.css'; // Make sure you have the CSS file

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    // Replace this with the actual API call to fetch transaction history
    const fetchTransactions = async () => {
      try {
        const response = await axios.get('/api/transactions/user/{userId}'); // Replace with your actual API endpoint
        setTransactions(response.data.transactions);
      } catch (error) {
        console.error('Error fetching transactions:', error);
        // Handle error (show notification, default value, etc.)
      }
    };

    fetchTransactions();
  }, []);

  return (
    <div className="page-container">
      <h1 className="section-header">Transaction History</h1>
      <div className="section-container">
        {transactions.length > 0 ? (
          <ul className="section-list">
            {transactions.map((transaction) => (
              <li key={transaction.id} className="section-list-item">
                <div className="transaction-details">
                  <span>{transaction.date}</span>
                  <span>{transaction.type}</span>
                  <span>{transaction.token}</span>
                  <span>Amount: {transaction.amount}</span>
                </div>
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
