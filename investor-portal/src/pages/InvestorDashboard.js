import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';


import './InvestorDashboard.css';

// Mock data for the dashboard, this would be fetched from an API in a real app
const mockData = {
  investorName: 'John Doe',
  walletBalance: '10,000',
  recentTransactions: [
    { id: 1, type: 'Buy', token: 'Token A', amount: '1,000', date: '2023-01-01' },
    { id: 2, type: 'Sell', token: 'Token B', amount: '500', date: '2023-01-02' },
    // ...more transactions
  ],
};

const InvestorDashboard = () => {
  const [investorData, setInvestorData] = useState(mockData);

  // In a real app, you would fetch this data from an API
  useEffect(() => {
    // fetchInvestorData();
  }, []);

  // Placeholder for fetch function
  const fetchInvestorData = async () => {
    // const response = await apiCallToFetchData();
    // setInvestorData(response.data);
  };

  return (
    <div className="investor-dashboard">
      <div className="dashboard-header">
        <h1>Welcome, {investorData.investorName}</h1>
      </div>
      <div className="wallet-balance">
        <h2>Wallet Balance</h2>
        <p>{investorData.walletBalance}</p>
      </div>
      <div className="recent-transactions">
        <h2>Recent Transactions</h2>
        <ul>
          {investorData.recentTransactions.map((transaction) => (
            <li key={transaction.id}>
              <strong>{transaction.date}:</strong> {transaction.type} {transaction.token} - <strong>Amount:</strong> {transaction.amount}
            </li>
          ))}
        </ul>
      </div>
      {/* You can uncomment and use the .dashboard-actions if needed */}
    </div>
  );
};

export default InvestorDashboard;
