import React from 'react';
import './ContractProgressItem.css'; // Import your custom CSS file for ContractProgressItem

const ContractProgressItem = ({ contract, onSelect, isSelected }) => {
    const shortenDID = (did) => {
        // Implement your logic to shorten the DID here
        // For example, you can keep the first and last few characters
        return `did:peaq:${did.substring(0, 8)}...${did.slice(-8)}`;
    };

    return (
        <div className="section-container" onClick={onSelect}>
            <div>
                <h3>{contract.name}</h3>
                <span className="toggle-arrow">{isSelected ? '▲' : '▼'}</span>
            </div>
            {isSelected && (
                <div>
                    <div className={'section-container'}>
                        <h4>Status</h4>
                        <ul>
                            {contract.statusUpdates && contract.statusUpdates.length > 0 ? (
                                contract.statusUpdates.map((status, index) => (
                                    <li key={index}>{status.statusMessages}</li>
                                ))
                            ) : (
                                <li>No status updates available</li>
                            )}
                        </ul>
                    </div>
                    <div className={'section-container'}>
                        <h4>General Info</h4>
                        <p>{contract.projectDescription}</p>
                    </div>


                    <div className={'section-container'}>
                        <h4>Funding</h4>
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
                    </div>

                    <div className={'section-container'}>
                        <h4>Associated Assets</h4>
                        {contract.associatedAssets && contract.associatedAssets.length > 0 ? (
                            contract.associatedAssets.map((asset, index) => (
                                <div className={'section-container'} key={index}>
                                    <h4 className={'section-header'}>
                                        {`Serial Number: ${asset.serialNumber} (DID: ${shortenDID(asset.DID.value)})`}
                                    </h4>
                                    <p>Asset Type: {asset.assetType}</p>
                                    <p>Brand: {asset.brand}</p>
                                    <p>Model: {asset.model}</p>
                                    <p>Capacity (kWh): {asset.capacity}</p>
                                    <p>Power (kW): {asset.power}</p>
                                    {/* Add more asset details as needed */}
                                </div>
                            ))
                        ) : (
                            <p>No associated assets available</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ContractProgressItem;
