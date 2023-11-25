import React, { useState, useEffect } from 'react';
import axios from 'axios';
import BalanceChart from '../components/BalanceChart';
import './InvestorDashboard.css';

const InvestorDashboard = () => {
    const [investorData, setInvestorData] = useState(null); // Initialize state to null

    useEffect(() => {
        const fetchInvestorData = async () => {
            const userToken = localStorage.getItem('authToken'); // Retrieve JWT token

            try {
                const response = await axios.get(`${process.env.REACT_APP_PENOMO_API}/api/investor`, {
                    headers: {
                        Authorization: `Bearer ${userToken}` // Include JWT token in header
                    }
                });
                setInvestorData(response.data); // Update state with investor data
            } catch (error) {
                console.error('Error fetching investor data:', error);
                // Handle error (e.g., show a message to the user)
            }
        };

        fetchInvestorData();
    }, []);

    // Mock data for the dashboard
    const mockData = {
        investorName: 'John Doe',
        walletBalances: {
            USDC: 9000,
            ETH: 5.3
        },
        portfolio: [
            { tokenName: 'Token A', balance: 500, totalRevenue: 1500, currentPrice: 2.5, contractTerm: 12 },
            { tokenName: 'Token B', balance: 300, totalRevenue: 900, currentPrice: 1.8, contractTerm: 8 },
            // ...add more tokens as necessary
        ],
        recentTransactions: [
            { id: 1, type: 'Buy', token: 'Token A', amount: 1000, date: '2023-01-01' },
            { id: 2, type: 'Sell', token: 'Token B', amount: 500, date: '2023-01-02' },
            // ...more transactions
        ],
    };

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
                            <strong className="balance-title">USDC</strong>
                            <span className="balance-amount">{investorData.walletBalances.USDC.toFixed(2)}</span>
                            <div className="btn-container">
                                <button className="btn-penomo">Top Up</button>
                                <button className="btn-penomo">Withdraw</button>
                            </div>
                        </div>
                        <div className="wallet-balance">
                            <strong className="balance-title">ETH</strong>
                            <span className="balance-amount">{investorData.walletBalances.ETH.toFixed(3)}</span>
                            <div className="btn-container">
                                <button className="btn-penomo">Top Up</button>
                                <button className="btn-penomo">Withdraw</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="section-container">
                <h2 className="section-header">Security Tokens</h2>
                {investorData.portfolio.map((token) => (
                    <div className="portfolio-item" key={token.tokenName}>

                        <strong>{token.tokenName}</strong>
                        <span> Balance: {token.balance}</span>
                        <span> Current Price: USDC {token.currentPrice.toFixed(2)}</span>
                        <span> Total Revenue: USDC {token.totalRevenue.toFixed(2)}</span>
                        <span> Remaining Contract Term: {token.contractTerm} months</span>

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
        </div >
    );
};

export default InvestorDashboard;


