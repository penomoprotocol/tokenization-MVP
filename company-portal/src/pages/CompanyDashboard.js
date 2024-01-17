// CompanyDashboard.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import TopUpWallet from '../components/TopUpWallet';
import WithdrawWallet from '../components/WithdrawWallet';
import AssetCard from '../components/AssetCard'; // Import the AssetCard component
import './CompanyDashboard.css';

const CompanyDashboard = () => {
    const [companyData, setCompanyData] = useState(null);
    const [companyTransactions, setCompanyTransactions] = useState([]);
    const [showTopUp, setShowTopUp] = useState(false);
    const [isLoadingCompanyData, setIsLoadingTokenContracts] = useState(true);
    const [showWithdraw, setShowWithdraw] = useState(false);
    const [selectedCurrency, setSelectedCurrency] = useState('ETH');

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
            if (companyData?.ethereumPublicKey) {
                try {
                    const address = companyData.ethereumPublicKey;
                    const response = await axios.get(`${process.env.REACT_APP_PENOMO_API}/api/transactions/user/${address}`);
                    setCompanyTransactions(response.data.slice(0, 5));
                } catch (error) {
                    console.error('Error fetching transactions:', error);
                }
            }
        };

        fetchTransactions();
    }, [companyData?.ethereumPublicKey]);

    const toggleWithdraw = (currency) => {
        setSelectedCurrency(currency);
        setShowWithdraw(!showWithdraw);
    };

    const fullTokenAddressLink = (address) => `https://agung-testnet.subscan.io/token/${address}`;

    function roundToDecimals(str, x) {
        let num = parseFloat(str);
        if (isNaN(num)) {
            return 'Invalid input';
        }
        if (num < 1 && num % 1 !== 0) {
            let num_mul = num;
            let decimalPlaces = 0;
            while (num_mul < 1) {
                num_mul = num_mul * 10;
                decimalPlaces = decimalPlaces + 1;
            }
            const totalDigits = decimalPlaces + 1;
            return num.toFixed(Math.max(totalDigits, x));
        } else {
            return num.toFixed(x);
        }
    }

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

            {/* Add the AssetCard component to display the number of assets */}
            <AssetCard totalAssets={companyData.tokens.length} assetsInProgress={assetsInProgress} />
            
            <div className="section-container">
                <h2 className="section-header">Balance</h2>
                <div className="balances-container">
                    <div className="wallet-balances-container">
                    <div className="wallet-balance">
                            <strong className="balance-title">$</strong>
                            <span className="balance-amount">{roundToDecimals(companyData.balances.usdcBalance, 2)}</span>
                            <div className="btn-container">
                                <button className="btn-penomo" onClick={() => setShowTopUp(true)}>Top Up</button>
                                <button className="btn-penomo-secondary" onClick={() => toggleWithdraw('USDC')}>Withdraw</button>
                            </div>
                        </div>
                        <div className="wallet-balance">
                            <strong className="balance-title">PENOMO</strong>
                            <span className="balance-amount">{roundToDecimals(companyData.balances.agungBalance, 2)}</span>
                            <div className="btn-container">
                                <button className="btn-penomo" onClick={() => setShowTopUp(true)}>Top Up</button>
                                <button className="btn-penomo-secondary" onClick={() => toggleWithdraw('ETH')}>Withdraw</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="section-container">
    <h2 className="section-header">Your Financing Pools ({companyData.tokens.length} listed on penomo, {assetsInProgress} in progress) </h2>
    {isLoadingCompanyData ? (
        <p>Loading...</p>
    ) : companyData && companyData.tokens.length > 0 ? (
        companyData.tokens.map((token) => (
            <div className="portfolio-item" key={token.name}>
                <div style={{ flex: '1 1 33.3%' }} className="label-value">
                    <strong>{token.name} </strong>
                    <a href={fullTokenAddressLink(token.tokenContractAddress)}
                        target="_blank" rel="noopener noreferrer">
                        <span>({token.symbol})</span>
                    </a>
                </div>
                <div style={{ flex: '1 1 33.3%' }} className="label-value">
                    <strong className="label">Available Funds</strong>
                    <span className="value">${roundToDecimals(token.liquidityPoolBalance.usdcBalance, 2)}</span>
                </div>
                <div className="btn-container" style={{ flex: '1 1 10%' }}>
                    <button className="btn-penomo">Withdraw</button>
                </div>
            </div>
        ))
    ) : (
        <p>No Tokenized Assets.</p>
    )}
</div>


            <div className="recent-transactions section-container">
                <h2>Recent Transactions</h2>
                <ul className="section-list">
                    {[...companyTransactions].map((transaction, index) => (
                        <li className="section-list-item" key={index} onClick={() => window.open(`https://agung-testnet.subscan.io/tx/${transaction.hash}`, '_blank')}>
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
                />
            }

        </div >
    );
};

export default CompanyDashboard;
