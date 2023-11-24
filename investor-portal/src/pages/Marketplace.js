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
                const apiUrl = `${process.env.REACT_APP_PENOMO_API}/api/tokens`;
                console.log("API URL:", apiUrl);
                const response = await axios.get(apiUrl);
                setTokens(response.data);
            } catch (error) {
                console.error('Error fetching tokens:', error);
            }
        };

        fetchTokens();
    }, []);

    const handleBuyTokensClick = (token) => {
        console.log('Opening modal for token:', token);
        setSelectedToken(token);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setSelectedToken(null);
        setIsModalOpen(false);
    };

    const shortAddress = (address) => `${address.slice(0, 6)}...${address.slice(-4)}`;

    const fullTokenAddressLink = (address) => `https://sepolia.etherscan.io/token/${address}`;
    const weiToEth = (wei) => {
        const eth = wei / 1e18; // Convert wei to ETH
        const ethString = eth.toString();

        // Find the position of the first non-zero digit after the decimal
        const firstNonZero = ethString.indexOf('.') + 1 + ethString.substring(ethString.indexOf('.') + 1).search(/[1-9]/);

        // Use toPrecision with the position of the first non-zero digit + 2 for two decimal places
        return eth.toPrecision(firstNonZero - 2);
    };

    return (
        <div className="page-container">
            <h1 className="page-header">Marketplace</h1>
            <div className="row">
                {tokens.map((token) => (
                    <div key={token._id} className="col-12 col-md-6 col-lg-4 mb-4">
                        <div className="section-container h-100">
                            <div className="card-content">
                                <h2>{token.name} ({token.symbol})</h2>
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
                                        <div className="detail-value">{token.revenueShare / 100}%</div>
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
                                        <div className="detail-value">{weiToEth(token.tokenPrice)} ETH</div>
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
                    closeModal={() => handleCloseModal()}
                    show={isModalOpen}
                />
            )}
        </div>
    );
}

export default Marketplace;

