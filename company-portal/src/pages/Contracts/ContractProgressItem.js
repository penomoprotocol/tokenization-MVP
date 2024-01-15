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
            <div className='contract-header'>
                <h3>{contract.name}</h3>
                <p><strong>Total Funding:</strong>  ${contract.fundingCurrent ? `$${contract.fundingCurrent}` : 'N/A'}</p>
                <p><strong>Funding Goal:</strong> {contract.financingGoal ? `$${contract.financingGoal.toLocaleString()}` : 'N/A'}</p>
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

                    <div className='section-container'>
                        <h4>Funding Info</h4>
                        <p><strong>Contract Address: </strong> {contract.tokenContractAddress ? `${contract.tokenContractAddress}` : 'N/A'}</p>
                        <p><strong>Contract Term: </strong> {contract.contractTerm ? `${contract.contractTerm} months` : 'N/A'}</p>
                        <p><strong>Revenue Share: </strong> {contract.revenueShare ? `${contract.revenueShare}%` : 'N/A'}</p>
                        <p><strong>Funding Goal:</strong> {contract.financingGoal ? `$${contract.financingGoal.toLocaleString()}` : 'N/A'}</p>
                        <p><strong>Share Supply: </strong>{contract.maxTokenSupply ? contract.maxTokenSupply : 'N/A'}</p>
                        <p><strong>Share Price: </strong> ${contract.tokenPrice ? contract.tokenPrice : 'N/A'}</p>
                    </div>

                    <div className='section-container'>
                        <h4>Funding Usage</h4>
                        {contract.fundUsage && contract.fundUsage.length > 0 ? (
                            contract.fundUsage.map((usage, index) => (
                                <div className='section-container' key={index}>
                                    <span><strong>Type: </strong>{usage.description}</span>
                                    <span><strong>Amount: </strong>${usage.amount.toLocaleString()}</span>
                                    <span><strong>Details:</strong> {usage.description}</span>
                                </div>
                            ))
                        ) : (
                            <p>No fund usage information available</p>
                        )}
                    </div>

                    <div className={'section-container'}>
                        <h4 className={'section-header'}>Projected Revenue</h4>
                        {contract.revenueStreams && contract.revenueStreams.length > 0 ? (
                            contract.revenueStreams.map((stream, index) => (
                                <div className='section-container' key={index}>
                                    <span><strong>Type: </strong>{stream.name}</span>
                                    <span><strong>Amount:</strong> ${stream.amount.toLocaleString()}</span>
                                    <span><strong>Details:</strong> {stream.details}</span>
                                </div>
                            ))
                        ) : (
                            <p>No revenue streams available</p>
                        )}
                    </div>

                    <div className={'section-container'}>
                        <h4>Associated Assets</h4>
                        {contract.associatedAssets && contract.associatedAssets.length > 0 ? (
                            contract.associatedAssets.map((asset, index) => (
                                <div className={'section-container'} key={index}>
                                    <strong className={'section-header'}>
                                        {`Serial Number: ${asset.serialNumber} (DID: ${shortenDID(asset.DID.value)})`}
                                    </strong>
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

                    <div className={'section-container'}>
                        <h3>General Info</h3>
                        <p>{contract.projectDescription}</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ContractProgressItem;
