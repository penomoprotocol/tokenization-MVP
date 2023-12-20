import React, { useState, useEffect } from 'react';
import axios from 'axios';
import BuyTokens from '../components/BuyTokens';

import './Marketplace.css';

const Marketplace = () => {
    const [tokens, setTokens] = useState([]);
    const [selectedToken, setSelectedToken] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        const fetchTokens = async () => {
            try {
                const apiUrl = `${process.env.REACT_APP_PENOMO_API}/api/token/all`;
                const response = await axios.get(apiUrl);
                setTokens(response.data); // Use the token data directly from the API response
            } catch (error) {
                console.error('Error fetching tokens:', error);
            }
        };

        fetchTokens();
    }, []);

    const handleBuyTokensClick = (token) => {
        setSelectedToken(token);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setSelectedToken(null);
        setIsModalOpen(false);
    };

    const shortAddress = (address) => `${address.slice(0, 6)}...${address.slice(-4)}`;
    const fullTokenAddressLink = (address) => `https://agung-testnet.subscan.io/token/${address}`;
    const formatTokenPrice = (price, currency) => currency === 'USDC' ? `${price} USDC` : `${price} ETH`;

    // const weiToEth = (wei) => {
    //     const eth = wei / 1e18;
    //     return eth.toFixed(3); // Adjust the precision as needed
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
    

    return (
        <div className="page-container">
            <h1 className="page-header">Platform</h1>
            <div className="row">
                {tokens.map((token) => (
                    <div key={token._id} className="col-12 col-md-6 col-lg-4 mb-4">
                        <div className="section-container h-100">
                            <div className="card-content">
                                <h2>{token.name}</h2>
                                <div className="token-details">
                                    <div className="token-detail">
                                        <div className="detail-name">Token Contract:</div>
                                        <div className="detail-value">
                                            <a href={fullTokenAddressLink(token.tokenContractAddress)}
                                                target="_blank" rel="noopener noreferrer">
                                                {shortAddress(token.tokenContractAddress)}
                                            </a>
                                        </div>
                                    </div>
                                    <div className="token-detail">
                                        <div className="detail-name">Revenue Share:</div>
                                        <div className="detail-value">{token.revenueShare *100}%</div>
                                    </div>
                                    <div className="token-detail">
                                        <div className="detail-name">Contract Term:</div>
                                        <div className="detail-value">{token.contractTerm} months</div>
                                    </div>
                                    <div className="token-detail">
                                        <div className="detail-name">Max Supply:</div>
                                        <div className="detail-value">{token.maxTokenSupply}</div>
                                    </div>
                                    <div className="token-detail">
                                        <div className="detail-name">Price:</div>
                                        <div className="detail-value">{formatTokenPrice(roundToDecimals(token.tokenPrice, 2), token.currency)}</div>
                                    </div>
                                    {/* Add more details as needed */}
                                </div>
                            </div>
                            <button className="btn-penomo" onClick={() => handleBuyTokensClick(token)}>Buy Tokens</button>
                        </div>
                    </div>
                ))}
            </div>

            {selectedToken && (
                <BuyTokens
                    token={selectedToken}
                    closeModal={handleCloseModal}
                    show={isModalOpen}
                />
            )}
        </div>
    );
}

export default Marketplace;

