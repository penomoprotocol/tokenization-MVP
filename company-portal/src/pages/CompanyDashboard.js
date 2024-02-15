// CompanyDashboard.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import TopUpWallet from '../components/TopUpWallet';
import WithdrawWallet from '../components/WithdrawWallet';
import AssetCard from '../components/AssetCard';
import BalanceCard from '../components/BalanceCard';
import './CompanyDashboard.css';
import CompanyCard from '../components/CompanyCard';

const CompanyDashboard = () => {
    const [companyData, setCompanyData] = useState(null);
    const [companyTransactions, setCompanyTransactions] = useState([]);
    const [showTopUp, setShowTopUp] = useState(false);
    const [isLoadingCompanyData, setIsLoadingTokenContracts] = useState(true);
    const [showWithdraw, setShowWithdraw] = useState(false);
    const [selectedCurrency, setSelectedCurrency] = useState('ETH');
    const [liquidityContract, setLiquidityContract] = useState(null);


    useEffect(() => {
        const fetchCompanyData = async () => {
            const userToken = localStorage.getItem('authToken');
            try {
                const companyDataRes = await axios.get(`${process.env.REACT_APP_PENOMO_API}/api/company/jwt`, {
                    headers: { Authorization: `Bearer ${userToken}` }
                });
                setCompanyData(companyDataRes.data);
                setIsLoadingTokenContracts(false);
            } catch (error) {
                console.error('Error fetching company data:', error);
                setIsLoadingTokenContracts(false);
            }
        };
        fetchCompanyData();
    }, []);

    useEffect(() => {
        const fetchTransactions = async () => {
          if (companyData?.tokens && companyData.tokens.length > 0) {
            try {
              const transactionsData = {};
      
              for (const token of companyData.tokens) {
                const address = token.liquidityContractAddress;
                const response = await axios.get(`${process.env.REACT_APP_PENOMO_API}/api/transactions/liquidityContract/${address}`);
                transactionsData[token.liquidityContractAddress] = response.data.slice(0, 5); // Store the first 5 transactions for each token
                await delay(1000 / 1000); // Wait for 1 second before the next request
              }
      
              setCompanyTransactions(transactionsData);
            } catch (error) {
              console.error('Error fetching transactions:', error);
            }
          }
        };
      
        fetchTransactions();
      }, [companyData?.tokens]);
      

    const toggleWithdraw = (currency, liquidityContractAddress) => {
        setSelectedCurrency(currency);
        setLiquidityContract(liquidityContractAddress);
        setShowWithdraw(!showWithdraw);
    };

    const fullTokenAddressLink = (address) => `https://agung-testnet.subscan.io/token/${address}`;

    function roundToDecimals(numStr, decimals) {
        let num = parseFloat(numStr);
        if (isNaN(num)) {
            return 'Invalid input';
        }

        return num.toLocaleString(undefined, {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
        });
    }

    // Rate limiter function
    const rateLimiter = (rateLimit, requestFunction) => {
        let lastCalled = Date.now();

        return async (...args) => {
            const now = Date.now();
            const diff = now - lastCalled;
            const delay = Math.max((1000 / rateLimit) - diff, 0);

            return new Promise((resolve, reject) => {
                setTimeout(async () => {
                    try {
                        const result = await requestFunction(...args);
                        resolve(result);
                    } catch (error) {
                        reject(error);
                    }
                    lastCalled = Date.now();
                }, delay);
            });
        };
    };

    // Delay function
    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));



    const calculateAssetsInProgress = (tokens) => {
        if (!tokens || tokens.length === 0) {
            return 0;
        }
        return tokens.reduce((count, token) => {
            // Implement your logic to count assets in progress here
            // For example, you can check a property like 'status' to determine if an asset is in progress
            // Update the condition below according to your data structure
            if (token.status === 'in-progress') {
                return count + 1;
            }
            return count;
        }, 0);
    };


    if (!companyData) {
        return <div className='content-center page-header'>Loading...</div>;
    }

    const assetsInProgress = calculateAssetsInProgress(companyData.tokens);

    return (
        <div className="page-container">
            <h1 className="page-header">Welcome, {companyData.firstname} {companyData.surname}</h1>



            <div className="two-columns">
                <div style={{ flex: '1' }}>
                    <BalanceCard companyData={companyData} />
                </div>
                <div style={{ flex: '1' }}>
                    <AssetCard companyData={companyData} />
                </div>
            </div>

            {/* 
                <div style={{ flex: '45%', marginLeft:'1rem' }}>
                    <div className="section-container" style={{ backgroundColor: "##e1e1e1" }}>
                        <div className="label-value-horizontal">
                            <h3 className="section-header">Total Balance</h3>
                        </div>
                        <div className="label-value-horizontal">
                            <div className="balance-title" style={{ fontSize: "2rem" }}>$</div>
                            <span className="balance-amount" style={{ fontSize: "2rem" }}>{roundToDecimals(companyData.balances.usdcBalance, 2)}</span>
                        </div>
                        <div ></div>
                    </div>
                </div> */}





            <div className="section-container">
                <h2 className="section-header">Your Financing Pools</h2>

                {isLoadingCompanyData ? (
                    <p>Loading...</p>
                ) : companyData && companyData.tokens.length > 0 ? (
                    companyData.tokens.map((token) => (
                        <div className="portfolio-item" key={token.name}>
                            <div style={{ flex: '1 1 33.3%' }} className="label-value">
                                <strong>{token.name} </strong>
                                <a href={fullTokenAddressLink(token.liquidityContractAddress + '?tab=erc20_transfer')}
                                    target="_blank" rel="noopener noreferrer">
                                    <span>{`${token.liquidityContractAddress.substring(0, 6)}...${token.liquidityContractAddress.substring(token.liquidityContractAddress.length - 6)}`}</span>
                                </a>
                            </div>
                            <div style={{ flex: '1 1 33.3%' }} className="label-value">
                                <strong className="label">Available Funds</strong>
                                <span className="value">${roundToDecimals(token.liquidityPoolBalance.usdcBalance, 2)}</span>
                            </div>
                            <div style={{ flex: '1 1 23.30%' }} className="btn-container">
                            </div>
                            <div style={{ flex: '1 1 10%' }} className="btn-container">
                                <button className="btn-penomo" onClick={() => toggleWithdraw('USDC', token.liquidityContractAddress)}>Withdraw</button>
                            </div>
                        </div>

                    ))
                ) : (
                    <p>No Tokenized Assets.</p>
                )}
            </div>

            <div className="transactions-section section-container">
                <h2>Recent Transactions</h2>
                <ul className="section-list">
                    {Object.values(companyTransactions) // Get all transactions arrays
                        .flat() // Flatten them into a single array
                        .sort((a, b) => new Date(b.date) - new Date(a.date)) // Sort by date descending
                        .map((transaction, index) => (
                            <li className="section-list-item" key={index} onClick={() => window.open(`https://agung-testnet.subscan.io/tx/${transaction.hash}`, '_blank')}>
                                <strong>Date:</strong> {transaction.date}<br />
                                <strong>Type:</strong> {transaction.transactionType}<br />
                                <strong>Project:</strong> {transaction.project}<br />
                                <strong>Amount:</strong> {transaction.payableAmount} {transaction.currency}<br />
                            </li>
                        ))}
                </ul>
            </div>






            {showTopUp &&
                <TopUpWallet
                    companyAddress={companyData.ethereumPublicKey}
                    closeModal={() => setShowTopUp(false)}
                    show={showTopUp}
                />
            }

            {showWithdraw &&
                <WithdrawWallet
                    currency={selectedCurrency}
                    closeModal={() => setShowWithdraw(false)}
                    show={showWithdraw}
                    bankAccount={companyData.bank}
                    liquidityContractAddress={liquidityContract}
                />
            }

        </div >
    );
};

export default CompanyDashboard;
