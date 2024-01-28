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
    const formatTokenPrice = (price, currency) => currency === 'USDC' ? `${price} USDC` : `${price} PENOMO`;

    // const weiToEth = (wei) => {
    //     const eth = wei / 1e18;
    //     return eth.toFixed(3); // Adjust the precision as needed
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


    return (
        <div className="page-container">
            <h1 className="page-header">Discover Assets</h1>
            <div className="row">
                {tokens
                    .sort((a, b) => {
                        // Calculate funding percentages
                        const fundingA = a.fundingCurrent / a.fundingGoal;
                        const fundingB = b.fundingCurrent / b.fundingGoal;

                        // Sort by funding status, sold out ones go to the end
                        if (fundingA >= 0.98 && fundingB < 0.98) return 1;
                        if (fundingB >= 0.98 && fundingA < 0.98) return -1;

                        // For the rest, sort by least funded first
                        return fundingA - fundingB;
                    })
                    .map((token) => (
                        <div key={token._id} className="col-12 col-md-6 col-lg-4 mb-4">
                            <div className="section-container h-100">
                                <div className="card-content">
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <h4>{token.name}</h4>
                                        <button className="info-btn" onClick={() => { /* Your info button click handler */ }}>
                                            i
                                        </button>
                                    </div>
                                    <div className="token-details">
                                        {/* <div className="token-detail">
    <div className="detail-name">Token Contract:</div>
    <div className="detail-value">
        <a href={fullTokenAddressLink(token.tokenContractAddress)}
            target="_blank" rel="noopener noreferrer">
            {shortAddress(token.tokenContractAddress)}
        </a>
    </div>
</div> */}
                                        {/* <div className="token-detail">
    <div className="detail-name">Revenue Share:</div>
    <div className="detail-value">{token.revenueShare}%</div>
</div> */}

                                        <div className="token-detail">
                                            <div className="detail-name">Project Type:</div>
                                            <div className="detail-value">{token.assetIds[0].assetType}</div>
                                        </div>
                                        <div className="token-detail">
                                            <div className="detail-name">Project Size:</div>
                                            <div className="detail-value">${roundToDecimals(token.fundingGoal, 2)}</div>
                                        </div>
                                        <div className="token-detail">
                                            <div className="detail-name">Issuer:</div>
                                            <div className="detail-value">{token.companyId.businessName}</div>
                                        </div>
                                        <div className="token-detail">
                                            <div className="detail-name">Contract Term:</div>
                                            <div className="detail-value">{token.contractTerm} months</div>
                                        </div>
                                        <div className="token-detail">
                                            <div className="detail-name">Projected Revenue:</div>
                                            <div className="detail-value">
                                                {roundToDecimals(token.revenueStreams[0].amount / token.fundingGoal * 100 - 100, 2)}%
                                            </div>
                                        </div>
                                        <div className="token-detail">
                                            {/* <div className="detail-name">Financing Status:</div> */}
                                            <div className="progress-bar">
                                                <div className="filler" style={{ width: `${(token.fundingCurrent / token.fundingGoal) * 102.04}%` }}>
                                                </div>
                                                <div className="percentage-text">{((token.fundingCurrent / token.fundingGoal) * 102.04).toFixed(2)}% Financed</div>
                                            </div>
                                            {/* <div className="detail-value">{roundToDecimals(token.fundingCurrent / token.fundingGoal / 0.98 * 100, 2)}%</div> */}
                                        </div>
                                        <div className="token-detail">
                                            <div className="detail-name">Token Price:</div>
                                            <div className="detail-value">{formatTokenPrice(roundToDecimals(token.tokenPrice, 2), token.currency)}</div>
                                        </div>
                                        {/* Add more details as needed */}
                                    </div>
                                </div>
                                <button
                                    className={"btn-penomo" + (token.fundingCurrent / token.fundingGoal >= 0.98 ? " btn-disabled" : "")}
                                    onClick={() => handleBuyTokensClick(token)}
                                    disabled={token.fundingCurrent / token.fundingGoal >= 0.98}
                                >
                                    {token.fundingCurrent / token.fundingGoal >= 0.98 ? 'Sold Out' : 'Buy Tokens'}
                                </button>
                            </div>
                        </div>
                    ))
                }
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

