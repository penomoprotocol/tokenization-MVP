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
                <h2>{contract.name}</h2>
                <p>Total Funding: {contract.liquidityPoolBalance ? contract.liquidityPoolBalance.totalFunding : 'N/A'}</p>
                <p>Funding Goal: {contract.financingGoal ? contract.financingGoal : 'N/A'}</p>

                <span className="toggle-arrow">{isSelected ? '▲' : '▼'}</span>
            </div>
            {isSelected && (
                <div>
                    <div className={'section-container'}>
                        <h3>Status</h3>
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
                        <h3>General Info</h3>
                        <p>{contract.projectDescription}</p>
                    </div>

                    <div className={'section-container'}>
                        <h3 className={'section-header'}>Funding</h3>
                        <div className='section-container'>
                        <h4>Status</h4>
                            <p><strong>Funding Goal:</strong> {contract.financingGoal ? `$${contract.financingGoal.toLocaleString()}` : 'N/A'}</p>
                            <p><strong>Total Funding:</strong>  ${contract.fundingCurrrent ? contract.fundingCurrrent : 'N/A'}</p>
                            <p><strong>Available Funds:</strong> 
                                
                                {contract.liquidityPoolBalance ? (
                                    contract.liquidityPoolBalance.usdcBalance ? ` $${contract.liquidityPoolBalance.usdcBalance}` : 'N/A'
                                ) : (
                                    'N/A'
                                )}
                            </p>
                        </div>
                        <div className='section-container'>
                        <h4>Info</h4>    
                        <p>Contract Term: {contract.contractTerm ? `${contract.contractTerm} months` : 'N/A'}</p>
                        <p>Max Supply: {contract.maxTokenSupply ? contract.maxTokenSupply : 'N/A'}</p>
                        <p>Token Price: ${contract.tokenPrice ? contract.tokenPrice : 'N/A'}</p>
                        </div>

                        <div className='section-container '>
                        <h4>Fund Usage</h4>
                            {contract.fundUsage && contract.fundUsage.length > 0 ? (
                                contract.fundUsage.map((usage, index) => (
                                    <div className='section-container' key={index}>
                                        <strong>Amount: ${usage.amount.toLocaleString()} </strong><br />
                                        <strong>Description:</strong> {usage.description}<br />
                                    </div>
                                ))
                            ) : (
                                <p>No fund usage information available</p>
                            )}
                        </div>
                    </div>

                    <div className={'section-container'}>
                        <h4 className={'section-header'}>Projected Revenue</h4>
                        <p>Revenue Share: {contract.revenueShare ? `${contract.revenueShare}%` : 'N/A'}</p>
                        <p>Revenue Streams</p>
                        {contract.revenueStreams && contract.revenueStreams.length > 0 ? (
                            contract.revenueStreams.map((stream, index) => (
                                <p key={index}>
                                    <strong>{stream.name}</strong> <br />
                                    <strong>Amount:</strong> ${stream.amount.toLocaleString()}<br />
                                    <strong>Details:</strong> {stream.details}<br />
                                </p>
                            ))
                        ) : (
                            <p>No revenue streams available</p>
                        )}
                    </div>

                    <div className={'section-container'}>
                        <h3>Associated Assets</h3>
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
