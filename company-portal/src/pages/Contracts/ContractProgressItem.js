import React from 'react';
import './ContractProgressItem.css'; // Import your custom CSS file for ContractProgressItem

const ContractProgressItem = ({ contract, onSelect, isSelected }) => {
    return (
        <div className={`contract-progress-item ${isSelected ? 'selected' : ''}`} onClick={onSelect}>
            <div className="contract-header">
                <h3>{contract.name}</h3>
                <span className="toggle-arrow">{isSelected ? '▲' : '▼'}</span>
            </div>
            {isSelected && (
                <div className="contract-details">
                    <h4>Status:</h4>
                    <ul>
                        {contract.statusUpdates && contract.statusUpdates.length > 0 ? (
                            contract.statusUpdates.map((status, index) => (
                                <li key={index}>{status.statusMessages}</li>
                            ))
                        ) : (
                            <li>No status updates available</li>
                        )}
                    </ul>

                    <h4>General Info:</h4>
                    <p>{contract.projectDescription}</p>

                    <h4>Funding:</h4>
                    <ul>
                        <li>Financing Goal: {contract.financingGoal ? `$${contract.financingGoal.toLocaleString()}` : 'N/A'}</li>
                        <li>Max Supply: {contract.maxTokenSupply}</li>
                        <li>Token Price: ${contract.tokenPrice}</li>
                        <li>Contract Term: {contract.contractTerm} months</li>
                        <li>Revenue Share: {contract.revenueShare}%</li>
                        <li>Fund Usage: {contract.fundUsage.join(', ')}</li>
                        <li>Liquidity Pool Balance:</li>
                        <ul>
                            <li>AGUNG Balance: {contract.liquidityPoolBalance.agungBalance} AGUNG</li>
                            <li>USDC Balance: {contract.liquidityPoolBalance.usdcBalance} USDC</li>
                        </ul>
                    </ul>

                    <h4>Asset:</h4>
                    {contract.tokens && contract.tokens.length > 0 ? (
                        contract.tokens.map((token, index) => (
                            <div key={index}>
                                <p>Asset Type: {token.assetType}</p>
                                <p>Asset DID: {token.assetDID}</p>
                                <p>Asset Value: {token.assetValue}</p>
                                <h5>Revenue Streams:</h5>
                                <ul>
                                    {token.revenueStreams.map((stream, streamIndex) => (
                                        <li key={streamIndex}>{stream}</li>
                                    ))}
                                </ul>
                            </div>
                        ))
                    ) : (
                        <p>No asset information available</p>
                    )}
                </div>
            )}
        </div>
    );
};

export default ContractProgressItem;
