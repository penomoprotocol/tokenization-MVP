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
            if (investorData?.ethereumPublicKey) {
                try {
                    const address = investorData.ethereumPublicKey; // Assuming this is your address variable
                    console.log("address:", address);
                    const response = await axios.get(`${process.env.REACT_APP_PENOMO_API}/api/transactions/user/${address}`);

                    setInvestorTransactions(response.data.slice(0, 5)); // Store the first 5 transactions
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
    const fullTokenAddressLink = (address) => `https://agung-testnet.subscan.io/token/${address}`;

    // const weiToEth = (wei) => {
    //     return (wei / 1e18).toString();
    // };

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
                <h2 className="section-header">Your Payment Tokens</h2>
                <div className="balances-container">
                    <div className="wallet-balances-container">
                    <div className="wallet-balance">
                            <strong className="balance-title">USDC</strong>
                            <span className="balance-amount">{roundToDecimals(investorData.usdcBalance, 2)}</span>
                            <div className="btn-container">
                                <button className="btn-penomo" onClick={() => setShowTopUp(true)}>Top Up</button>
                                <button className="btn-penomo-secondary" onClick={() => toggleWithdraw('USDC')}>Withdraw</button>
                            </div>
                        </div>
                        <div className="wallet-balance">
                            <strong className="balance-title">PENOMO</strong>
                            <span className="balance-amount">{roundToDecimals(investorData.agungBalance, 2)}</span>
                            <div className="btn-container">
                                <button className="btn-penomo" onClick={() => setShowTopUp(true)}>Top Up</button>
                                <button className="btn-penomo-secondary" onClick={() => toggleWithdraw('ETH')}>Withdraw</button>
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            <div className="section-container">
                <h2 className="section-header">Your Asset Tokens</h2>
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
                            {/* <div style={{ flex: '1 1 16.6%' }} className="label-value">
                                <strong className="label">Max Supply</strong>
                                <span className="value">{token.maxTokenSupply}</span>
                            </div> */}
                            <div style={{ flex: '1 1 16.6%' }} className="label-value">
                                <strong className="label">Holdings</strong>
                                <span className="value">{token.balance}</span>
                            </div>
                            <div style={{ flex: '1 1 16.6%' }} className="label-value">
                                <strong className="label">Holdings Value</strong>
                                <span className="value">{formatTokenPrice(roundToDecimals(token.balance*token.tokenPrice,2), token.currency)}</span>
                            </div>
                            <div style={{ flex: '1 1 16.6%' }} className="label-value">
                                <strong className="label">Rem. Contract Term</strong>
                                <span className="value">{token.contractTerm} months</span>
                            </div>
                            {/* <div style={{ flex: '1 1 16.6%' }} className="label-value">
                                <strong className="label">Total Revenue</strong>
                                <span className="value">{formatTokenPrice(roundToDecimals(token.balance*token.tokenPrice*0.21234,2), token.currency)}</span>
                            </div> */}
                            <div className="btn-container" style={{ flex: '1 1 6.6%'}}>
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
                    {investorTransactions ? (
                        [...investorTransactions] // Create a copy of the array
                            // .reverse() // Reverse the copy of the array
                            .map((transaction, index) => (
                                <li className="section-list-item" key={index} onClick={() => window.open(`https://agung-testnet.subscan.io/tx/${transaction.hash}`, '_blank')}>
                                    <strong>Type:</strong> {transaction.transactionType}<br />
                                    {transaction.tokenSymbol && <><strong>Token:</strong> {transaction.tokenSymbol}<br /></>}
                                    {transaction.tokenAmount && <><strong>Token Amount:</strong> {transaction.tokenAmount}<br /></>}
                                    <strong>From:</strong> {transaction.from}<br />
                                    <strong>To:</strong> {transaction.to}<br />
                                    <strong>Transferred Amount:</strong> {roundToDecimals(transaction.payableAmount, 2)} {transaction.currency}<br />
                                </li>
                            ))
                    ) : (
                        <p>No transactions found.</p>
                    )}
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


