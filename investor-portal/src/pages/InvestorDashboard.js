import React, { useState, useEffect } from 'react';
import axios from 'axios';
import BalanceChart from '../components/BalanceChart';
import TopUpWallet from '../components/TopUpWallet';

import './InvestorDashboard.css';

const InvestorDashboard = () => {
    const [investorData, setInvestorData] = useState(null); // Initialize state to null
    const [investorTokenHoldings, setInvestorTokenHoldings] = useState(null); // Initialize state to null
    const [showTopUp, setShowTopUp] = useState(false);

    useEffect(() => {
        const fetchInvestorData = async () => {
            const userToken = localStorage.getItem('authToken'); // Retrieve JWT token

            try {
                const investorData = await axios.get(`${process.env.REACT_APP_PENOMO_API}/api/investor/jwt`, {
                    headers: {
                        Authorization: `Bearer ${userToken}` // Include JWT token in header
                    }
                });
                setInvestorData(investorData.data); // Update state with investor data
                const investorTokenHoldings = await axios.get(`${process.env.REACT_APP_PENOMO_API}/api/token/jwt`, {
                    headers: {
                        Authorization: `Bearer ${userToken}` // Include JWT token in header
                    }
                });
                setInvestorTokenHoldings(investorTokenHoldings.data); // Update state with investor data
                console.log("Investor Data: ", investorData);
                console.log("Investor Token Holdings: ", investorTokenHoldings);
            } catch (error) {
                console.error('Error fetching investor data:', error);
                // Handle error (e.g., show a message to the user)
            }
        };

        fetchInvestorData();
    }, []);

    const fullTokenAddressLink = (address) => `https://sepolia.etherscan.io/token/${address}`;

    const weiToEth = (wei) => {
        return (wei / 1e18).toString();
    };

    function roundToDecimals(str, x) {
        let num = parseFloat(str);
        if (isNaN(num)) {
            return 'Invalid input'; // or handle the error as needed
        }
        // Check if the number is a whole number
        if (num % 1 === 0) {
            return num.toFixed(2); // For whole numbers, keep two decimal places
        } else {
            return parseFloat(num.toFixed(x));
        }

    }

    const mockHistoricData = {
        labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
        datasets: [
            {
                label: "USDC Balance",
                data: [2000, 2400, 2200, 2800, 3000, 3200],
                borderColor: "rgb(75, 192, 192)",
                backgroundColor: "rgba(75, 192, 192, 0.5)",
            },
            {
                label: "ETH Balance",
                data: [0.5, 0.6, 0.55, 0.65, 0.64, 0.66],
                borderColor: "rgb(153, 102, 255)",
                backgroundColor: "rgba(153, 102, 255, 0.5)",
            }
        ]
    };

    // Check if investorData is loaded
    if (!investorData) {
        return <div className='content-center page-header'>Loading...</div>; // Or any other loading state representation
    }

    return (
        <div className="page-container">
            <h1 className="page-header">Welcome, {investorData.firstname} {investorData.surname}</h1>
            <div className="section-container">
                <div className="balance-chart-container">
                    {/* Here you would render your chart component */}
                    <BalanceChart data={mockHistoricData} />
                </div>
            </div>

            <div className="section-container">
                <h2 className="section-header">Cryptocurrencies</h2>
                <div className="balances-container">
                    <div className="wallet-balances-container">
                        <div className="wallet-balance">
                            <strong className="balance-title">ETH</strong>
                            <span className="balance-amount">{roundToDecimals(investorData.ethBalance, 4)}</span>
                            <div className="btn-container">
                                <button className="btn-penomo" onClick={() => setShowTopUp(true)}>Top Up</button>
                                <button className="btn-penomo">Withdraw</button>
                            </div>
                        </div>
                        <div className="wallet-balance">
                            <strong className="balance-title">USDC</strong>
                            <span className="balance-amount">{roundToDecimals(investorData.usdcBalance, 2)}</span>
                            <div className="btn-container">
                            <button className="btn-penomo" onClick={() => setShowTopUp(true)}>Top Up</button>
                                <button className="btn-penomo">Withdraw</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="section-container">
                <h2 className="section-header">Security Tokens</h2>
                {investorTokenHoldings && investorTokenHoldings.length > 0 ? (
                    investorTokenHoldings.map((token) => (
                        <div className="portfolio-item" key={token.name}>
                            <div style={{ flex: '1 1 16.6%' }} className="label-value">
                                <strong>{token.name} </strong>
                                <a href={fullTokenAddressLink(token.tokenContractAddress)}
                                    target="_blank" rel="noopener noreferrer">
                                    {<><span>({token.symbol})</span></>}
                                </a>
                            </div>
                            <div style={{ flex: '1 1 16.6%' }} className="label-value">
                                <strong className="label">Max Supply</strong>
                                <span className="value">{token.maxTokenSupply}</span>
                            </div>
                            <div style={{ flex: '1 1 16.6%' }} className="label-value">
                                <strong className="label">Balance</strong>
                                <span className="value">{token.balance}</span>
                            </div>
                            <div style={{ flex: '1 1 16.6%' }} className="label-value">
                                <strong className="label">Current Price</strong>
                                <span className="value">ETH {weiToEth(token.tokenPrice)}</span>
                            </div>
                            <div style={{ flex: '1 1 16.6%' }} className="label-value">
                                <strong className="label">Remaining Contract Term</strong>
                                <span className="value">{token.contractTerm} months</span>
                            </div>
                            {/* <span> Total Revenue: USDC {token.totalRevenue.toFixed(2)}</span> */}
                            <div className="btn-container" style={{ flex: '1 1 16.6%' }}>
                                <button className="btn-penomo">Sell</button>
                            </div>
                        </div>
                    ))
                ) : (
                    <p>No token holdings found.</p> // This will display if the array is empty
                )}
            </div>


            <div className="recent-transactions section-container">
                <h2>Recent Transactions</h2>
                <ul className="section-list">
                    {/* {investorData.recentTransactions.map((transaction) => (
                        <li className="section-list-item" key={transaction.id}>
                            <strong>{transaction.date}:</strong> {transaction.type} {transaction.token} - <strong>Amount:</strong> {transaction.amount}
                        </li>
                    ))} */}
                </ul>
            </div>

            {
                showTopUp &&
                <TopUpWallet
                    investorAddress={investorData.ethereumPublicKey}
                    closeModal={() => setShowTopUp(false)}
                    show={showTopUp}
                />
            }
        </div >
    );
};

export default InvestorDashboard;


