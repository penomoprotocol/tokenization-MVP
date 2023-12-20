import React, { useState, useEffect } from 'react';
import axios from 'axios';

import './Transactions.css'; // Ensure you have the CSS file

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true); // New loading state
  const [investorData, setInvestorData] = useState(null);

  useEffect(() => {
    const fetchInvestorData = async () => {
        const userToken = localStorage.getItem('authToken');
        try {
            const investorDataRes = await axios.get(`${process.env.REACT_APP_PENOMO_API}/api/investor/jwt`, {
                headers: { Authorization: `Bearer ${userToken}` }
            });
            setInvestorData(investorDataRes.data);
        } catch (error) {
            console.error('Error fetching investor data:', error);
        }
    };
    fetchInvestorData();
}, []);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const address = investorData.ethereumPublicKey; 
        const response = await axios.get(`${process.env.REACT_APP_PENOMO_API}/api/transactions/user/${address}`);
        setTransactions(response.data); 
      } catch (error) {
        console.error('Error fetching transactions:', error);
      } finally {
        setIsLoading(false); // Set loading to false after fetching data
      }
    };
    fetchTransactions();
  });

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

  return (
    <div className="page-container">
      <h1 className="page-header">Transaction History</h1>
      <div className="section-container">
        {isLoading ? (
          <p>Loading...</p> // Display Loading message
        ) : transactions.length > 0 ? (
                <ul className="section-list">
                {[...transactions].map((transaction, index) => (
                    <li className="section-list-item" key={index} onClick={() => window.open(`https://agung-testnet.subscan.io/tx/${transaction.hash}`, '_blank')}>
                        <strong>Date:</strong> {transaction.date}<br />
                        <strong>Type:</strong> {transaction.transactionType}<br />
                        {transaction.tokenSymbol && <><strong>Token:</strong> {transaction.tokenSymbol}<br /></>}
                        {transaction.tokenAmount && <><strong>Token Amount:</strong> {transaction.tokenAmount}<br /></>}
                        <strong>From:</strong> {transaction.from}<br />
                        <strong>To:</strong> {transaction.to}<br />
                        <strong>Transfered Amount:</strong> {roundToDecimals(transaction.payableAmount, 2)} {transaction.currency}<br />
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
