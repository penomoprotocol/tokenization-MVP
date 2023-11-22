import React, { useState, useEffect } from 'react';
import './InvestorDashboard.css'; // Assuming this CSS file includes the master styling

// Mock data for the dashboard
const mockData = {
  investorName: 'John Doe',
  walletBalance: 10000,
  portfolio: [
    { tokenName: 'Token A', balance: 500, totalRevenue: 1500 },
    { tokenName: 'Token B', balance: 300, totalRevenue: 900 },
    // ...add more tokens as necessary
  ],
  recentTransactions: [
    { id: 1, type: 'Buy', token: 'Token A', amount: '1,000', date: '2023-01-01' },
    { id: 2, type: 'Sell', token: 'Token B', amount: '500', date: '2023-01-02' },
    // ...more transactions
  ],
};

const InvestorDashboard = () => {
  const [investorData, setInvestorData] = useState(mockData);

  useEffect(() => {
    // Fetch data from API
  }, []);


  return (
    <div className="page-container">
      <h1 className="section-header">Welcome, {investorData.investorName}</h1>
      
      <div className="wallet-balance section-container">
        <span>Wallet Balance: ${investorData.walletBalance.toFixed(2)}</span>
        <div className="btn-container">
          <button className="btn-penomo">Top Up</button>
          <button className="btn-penomo">Withdraw</button>
        </div>
      </div>

      <div className="section-container">
        <h2 className="section-header">Your Portfolio</h2>
        {investorData.portfolio.map((token) => (
          <div className="portfolio-item" key={token.tokenName}>
            <span>
              <strong>{token.tokenName}</strong> Balance: {token.balance} Total Revenue: ${token.totalRevenue.toFixed(2)}
            </span>
            <div className="btn-container">
              <button className="btn-penomo">Sell</button>
            </div>
          </div>
        ))}
      </div>
<div className="recent-transactions section-container">
        <h2>Recent Transactions</h2>
        <ul className="section-list">
          {investorData.recentTransactions.map((transaction) => (
            <li className="section-list-item" key={transaction.id}>
              <strong>{transaction.date}:</strong> {transaction.type} {transaction.token} - <strong>Amount:</strong> {transaction.amount}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default InvestorDashboard;