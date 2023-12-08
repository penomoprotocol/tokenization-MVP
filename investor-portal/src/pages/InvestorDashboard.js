import React, { useState, useEffect } from 'react';
import axios from 'axios';
// import BalanceChart from '../components/BalanceChart';
import TopUpWallet from '../components/TopUpWallet';
import WithdrawWallet from '../components/WithdrawWallet'; // Import the WithdrawWallet component
import './InvestorDashboard.css';

const InvestorDashboard = () => {
    const [investorData, setInvestorData] = useState(null);
    const [investorTokenHoldings, setInvestorTokenHoldings] = useState(null);
    const [investorTransactions, setInvestorTransactions] = useState([]);
    const [showTopUp, setShowTopUp] = useState(false);
    const [isLoadingTokenHoldings, setIsLoadingTokenHoldings] = useState(true);
    const [showWithdraw, setShowWithdraw] = useState(false); // State for WithdrawWallet modal
    const [selectedCurrency, setSelectedCurrency] = useState('ETH');

    useEffect(() => {
        const fetchInvestorData = async () => {
            const userToken = localStorage.getItem('authToken');
            try {
                const investorDataRes = await axios.get(`${process.env.REACT_APP_PENOMO_API}/api/investor/jwt`, {
                    headers: { Authorization: `Bearer ${userToken}` }
                });
                setInvestorData(investorDataRes.data);

                const investorTokenHoldingsRes = await axios.get(`${process.env.REACT_APP_PENOMO_API}/api/token/jwt`, {
                    headers: { Authorization: `Bearer ${userToken}` }
                });
                setInvestorTokenHoldings(investorTokenHoldingsRes.data);
                setIsLoadingTokenHoldings(false);
            } catch (error) {
                console.error('Error fetching investor data:', error);
                setIsLoadingTokenHoldings(false); // Ensure loading state is set to false even if there's an error
            }
        };
        fetchInvestorData();
    }, []);

    useEffect(() => {
        const fetchTransactions = async () => {
            const userToken = localStorage.getItem('authToken');
            if (investorData?.ethereumPublicKey) {
                try {
                    const response = await axios.get(`${process.env.REACT_APP_PENOMO_API}/api/transactions/user/jwt`, {
                        headers: { Authorization: `Bearer ${userToken}` }
                    });
                    setInvestorTransactions(response.data.slice(-5)); // Store the last 5 transactions
                    // TODO: Calculate revenues from tokens and insert to setter function
                    // DEBUG
                    console.log(response);
                } catch (error) {
                    console.error('Error fetching transactions:', error);
                }
            }
        };

        fetchTransactions();
    }, [investorData?.ethereumPublicKey]);

    const toggleWithdraw = (currency) => {
        setSelectedCurrency(currency); // Set the selected currency
        setShowWithdraw(!showWithdraw);
    };
    const fullTokenAddressLink = (address) => `https://sepolia.etherscan.io/token/${address}`;

    // const weiToEth = (wei) => {
    //     return (wei / 1e18).toString();
    // };

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

    const formatTokenPrice = (price, currency) => currency === 'USDC' ? `${price} USDC` : `${price} ETH`;

    // const mockHistoricData = {
    //     labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    //     datasets: [
    //         {
    //             label: "USDC Balance",
    //             data: [2000, 2400, 2200, 2800, 3000, 3200],
    //             borderColor: "rgb(75, 192, 192)",
    //             backgroundColor: "rgba(75, 192, 192, 0.5)",
    //         },
    //         {
    //             label: "ETH Balance",
    //             data: [0.5, 0.6, 0.55, 0.65, 0.64, 0.66],
    //             borderColor: "rgb(153, 102, 255)",
    //             backgroundColor: "rgba(153, 102, 255, 0.5)",
    //         }
    //     ]
    // };

    // Check if investorData is loaded
    if (!investorData) {
        return <div className='content-center page-header'>Loading...</div>;
    }


    return (
        <div className="page-container">
            <h1 className="page-header">Welcome, {investorData.firstname} {investorData.surname}</h1>
            {/* <div className="section-container">
                <div className="balance-chart-container">
                    <BalanceChart data={mockHistoricData} />
                </div>
            </div> */}

            <div className="section-container">
                <h2 className="section-header">Cryptocurrencies</h2>
                <div className="balances-container">
                    <div className="wallet-balances-container">
                        <div className="wallet-balance">
                            <strong className="balance-title">ETH</strong>
                            <span className="balance-amount">{roundToDecimals(investorData.ethBalance, 2)}</span>
                            <div className="btn-container">
                                <button className="btn-penomo" onClick={() => setShowTopUp(true)}>Top Up</button>
                                <button className="btn-penomo-secondary" onClick={() => toggleWithdraw('ETH')}>Withdraw</button>
                            </div>
                        </div>
                        <div className="wallet-balance">
                            <strong className="balance-title">USDC</strong>
                            <span className="balance-amount">{roundToDecimals(investorData.usdcBalance, 2)}</span>
                            <div className="btn-container">
                                <button className="btn-penomo" onClick={() => setShowTopUp(true)}>Top Up</button>
                                <button className="btn-penomo-secondary" onClick={() => toggleWithdraw('USDC')}>Withdraw</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="section-container">
                <h2 className="section-header">RWA Tokens</h2>
                {isLoadingTokenHoldings ? (
                    <p>Loading...</p> // Display loading message while data is being fetched
                ) : investorTokenHoldings && investorTokenHoldings.length > 0 ? (
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
                                <span className="value">{formatTokenPrice(token.tokenPrice, token.currency)}</span>
                            </div>
                            <div style={{ flex: '1 1 16.6%' }} className="label-value">
                                <strong className="label">Rem. Contract Term</strong>
                                <span className="value">{token.contractTerm} months</span>
                            </div>
                            {/* <div style={{ flex: '1 1 16.6%' }} className="label-value">
                                <strong className="label">Total Revenue</strong>
                                <span className="value">USDC {"0.00"}</span>
                            </div> */}
                            {/* <div className="btn-container" style={{ flex: '1 1 16.6%' }}>
                                <button className="btn-penomo">Sell</button>
                            </div> */}
                        </div>
                    ))
                ) : (
                    <p>No token holdings found.</p> // This will display if the array is empty
                )}
            </div>


            <div className="recent-transactions section-container">
                <h2>Recent Transactions</h2>
                <ul className="section-list">
                    {[...investorTransactions].reverse().map((transaction, index) => (
                        <li className="section-list-item" key={index} onClick={() => window.open(`https://sepolia.etherscan.io/tx/${transaction.hash}`, '_blank')}>
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
            </div>



            {
                showTopUp &&
                <TopUpWallet
                    investorAddress={investorData.ethereumPublicKey}
                    closeModal={() => setShowTopUp(false)}
                    show={showTopUp}
                />
            }

{
                showWithdraw &&
                <WithdrawWallet
                    currency={selectedCurrency}
                    closeModal={() => setShowWithdraw(false)}
                    show={showWithdraw}
                />
            }

        </div >
    );
};

export default InvestorDashboard;


