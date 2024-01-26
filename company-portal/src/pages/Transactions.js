import React, { useState, useEffect } from 'react';
import axios from 'axios';

import './Transactions.css'; // Ensure you have the CSS file

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true); // Loading state
  const [companyData, setCompanyData] = useState(null);

  useEffect(() => {
    const fetchCompanyData = async () => {
        const userToken = localStorage.getItem('authToken');
        try {
            const response = await axios.get(`${process.env.REACT_APP_PENOMO_API}/api/company/jwt`, {
                headers: { Authorization: `Bearer ${userToken}` }
            });
            setCompanyData(response.data);
        } catch (error) {
            console.error('Error fetching company data:', error);
        }
    };
    fetchCompanyData();
  }, []);

  useEffect(() => {
    const fetchTransactions = async () => {
        if (companyData?.tokens && companyData.tokens.length > 0) {
            try {
                // Map each token to a request to fetch its transactions
                const transactionsRequests = companyData.tokens.map(token => {
                    const address = token.liquidityContractAddress;
                    return axios.get(`${process.env.REACT_APP_PENOMO_API}/api/transactions/liquidityContract/${address}`);
                    
                });

                // Use Promise.all to handle all requests concurrently
                const transactionsResponses = await Promise.all(transactionsRequests);
                console.log("transactionsResponses: ", transactionsResponses);
                // Process responses to extract data
                const transactionsData = transactionsResponses.reduce((acc, response, index) => {
                    const token = companyData.tokens[index];
                    acc[token.liquidityContractAddress] = response.data.slice(0, 5); // Store the first 5 transactions for each token
                    return acc;
                }, {});

                setTransactions(transactionsData);
                console.log("transactionsData: ", transactionsData);
            } catch (error) {
                console.error('Error fetching transactions:', error);
            }
        }
    };

    fetchTransactions();
}, [companyData?.tokens]);


  function roundToDecimals(str, x) {
    let num = parseFloat(str);
    if (isNaN(num)) return 'Invalid input';
    if (num < 1 && num % 1 !== 0) {
      let num_mul = num;
      let decimalPlaces = 0;
      while (num_mul < 1) {
        num_mul *= 10;
        decimalPlaces++;
      }
      const totalDigits = decimalPlaces + 1;
      return num.toFixed(Math.max(totalDigits, x));
    } else {
      return num.toFixed(x);
    }
  }

  return (
    <div className="page-container">
        <h1 className="page-header">Transaction History</h1>
        <div className="section-container">
            {isLoading ? (
                <p>Loading...</p> // Display Loading message
            ) : Object.keys(transactions).length > 0 ? (
                Object.entries(transactions).map(([contractAddress, contractTransactions]) => (
                    <div key={contractAddress}>
                        <h2>Transactions for Contract: {contractAddress}</h2>
                        <ul className="section-list">
                            {contractTransactions.map((transaction, index) => (
                                <li className="section-list-item" key={index} onClick={() => window.open(`https://agung-testnet.subscan.io/tx/${transaction.hash}`, '_blank')}>
                                    <strong>Date:</strong> {transaction.date}<br />
                                    <strong>Type:</strong> {transaction.transactionType}<br />
                                    {transaction.tokenSymbol && <><strong>Token:</strong> {transaction.tokenSymbol}<br /></>}
                                    {transaction.tokenAmount && <><strong>Token Amount:</strong> {transaction.tokenAmount}<br /></>}
                                    <strong>From:</strong> {transaction.from}<br />
                                    <strong>To:</strong> {transaction.to}<br />
                                    <strong>Transferred Amount:</strong> {roundToDecimals(transaction.payableAmount, 2)} {transaction.currency}<br />
                                </li>
                            ))}
                        </ul>
                    </div>
                ))
            ) : (
                <p>No transactions found.</p>
            )}
        </div>
    </div>
);
};

export default Transactions;
