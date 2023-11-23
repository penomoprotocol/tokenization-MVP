import React, { useState, useEffect } from 'react';
import axios from 'axios';
import BuyTokens from '../components/BuyTokens';

import './Marketplace.css';

const Marketplace = () => {
    const [tokens, setTokens] = useState([]);
    const [selectedToken, setSelectedToken] = useState(null);

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
        setSelectedToken(token);
    };

    const handleCloseModal = () => {
        setSelectedToken(null);
    };

    const shortAddress = (address) => `${address.slice(0, 6)}...${address.slice(-4)}`;

    const fullTokenAddressLink = (address) => `https://sepolia.etherscan.io/token/${address}`;
    const weiToEth = (wei) => {
        const eth = wei / 1e18; // Convert wei to ETH
        const ethString = eth.toString();
      
        // Find the position of the first non-zero digit after the decimal
        const firstNonZero = ethString.indexOf('.') + 1 + ethString.substring(ethString.indexOf('.') + 1).search(/[1-9]/);
      
        // Use toPrecision with the position of the first non-zero digit + 2 for two decimal places
        return eth.toPrecision(firstNonZero-2);
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
                                {/* <p>Service Contract: <a href={fullAddressLink(token.serviceContractAddress)} target="_blank" rel="noopener noreferrer">{shortAddress(token.serviceContractAddress)}</a></p> */}
                                <p>Token Contract: <a href={fullTokenAddressLink(token.tokenContractAddress)} target="_blank" rel="noopener noreferrer">{shortAddress(token.tokenContractAddress)}</a></p>
                                <p>Revenue Share: {token.revenueShare}%</p>
                                <p>Contract Term: {token.contractTerm} months</p>
                                <p>Max Token Supply: {token.maxTokenSupply}</p>
                                <p>Token Price: {weiToEth(token.tokenPrice)} ETH</p>
                                {/* <p>Liquidity Contract: <a href={fullAddressLink(token.liquidityContractAddress)} target="_blank" rel="noopener noreferrer">{shortAddress(token.liquidityContractAddress)}</a></p>
                                <p>Revenue Distribution Contract: <a href={fullAddressLink(token.revenueDistributionContractAddress)} target="_blank" rel="noopener noreferrer">{shortAddress(token.revenueDistributionContractAddress)}</a></p>
                                
                                {token.revenueStreamContractAddresses && token.revenueStreamContractAddresses.map((address, index) => (
                                    <p key={index}>Revenue Stream Contract {index + 1}: <a href={fullAddressLink(address)} target="_blank" rel="noopener noreferrer">{shortAddress(address)}</a></p>
                                ))}
                                
                                {token.assetDIDs && token.assetDIDs.map((did, index) => (
                                    <p key={index}>Asset DID {index + 1}: {did}</p>
                                ))}  */}
                            </div>
                            <button className="btn-penomo" onClick={() => handleBuyTokensClick(token)}>Buy Tokens</button>
                        </div>
                    </div>
                ))}
            </div>

            {selectedToken && (
                <BuyTokens token={selectedToken} closeModal={handleCloseModal} show={!!selectedToken} />
            )}
        </div>
    );
};

export default Marketplace;
