import React, { useState } from 'react';
import './ContractProgressItem.css';
import UploadDocumentModal from '../../components/UploadDocumentModal';


const ContractProgressItem = ({ contract, onSelect, isSelected }) => {
    const [showUploadDocumentModal, setShowUploadDocumentModal] = useState(false);

    const renderStakeholdersList = () => {
        // Sort token holders by holding percentage in descending order
        const sortedTokenHolders = contract.tokenHolders.sort((a, b) => {
            const percentageA = (parseFloat(a.tokenBalance) / parseFloat(contract.maxTokenSupply)) * 100;
            const percentageB = (parseFloat(b.tokenBalance) / parseFloat(contract.maxTokenSupply)) * 100;
            return percentageB - percentageA; // For descending order
        });
    
        return sortedTokenHolders.map((holder, index) => (
            <tr key={index}> {/* It's better to use unique IDs instead of index if available */}
                <td>{holder.data.firstname}</td>
                <td>{holder.data.surname}</td>
                <td>{holder.address}</td>
                <td>{holder.tokenBalance}</td>
                <td>{((parseFloat(holder.tokenBalance) / parseFloat(contract.maxTokenSupply)) * 100).toFixed(2)}%</td>
            </tr>
        ));
    };

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

    const shortenDID = (did) => {
        // Implement your logic to shorten the DID here
        // For example, you can keep the first and last few characters
        return `did:peaq:${did.substring(0, 8)}...${did.slice(-8)}`;
    };

    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };
    return (
        <div className="section-container" onClick={onSelect}>
            <div className='contract-header'>
                <h3>{contract.name}</h3>
                <div className='center-vertical-group'><strong>Total Received:</strong>  ${contract.liquidityPoolBalance.usdcBalance ? `${roundToDecimals(contract.liquidityPoolBalance.usdcBalance,2)}` : '0.00'}</div>
                <div className="progress-bar">
                    <div className="filler" style={{ width: `${(contract.liquidityPoolBalance.usdcBalance / contract.fundingGoal) * 102.04}%` }}>
                    </div>
                    <div className="percentage-text">{((contract.liquidityPoolBalance.usdcBalance / contract.fundingGoal) * 102.04).toFixed(2)}% Financed</div>
                </div>
                <div className='center-vertical-group'><strong>Financing Goal:</strong> {contract.fundingGoal ? `$${roundToDecimals(contract.fundingGoal,2)}` : 'N/A'}</div>
                <div className='center-vertical-group'><strong>Status:</strong> {contract.statusUpdates[0].status}</div>
                <span className="toggle-arrow">{isSelected ? '▲' : '▼'}</span>
            </div>



            {isSelected && (
                <div>
                    <h4 style={{ marginTop: '2rem', marginBottom: '1rem' }}>Financing Status</h4>
                    <div className={'section-container'}>
                        {contract.statusUpdates && contract.statusUpdates.length > 0 ? (
                            contract.statusUpdates.map((status, index) => (
                                <div className="status-update" key={index}>
                                    <p><strong>Date:</strong> {formatDate(status.date)}</p>
                                    <p><strong>Status:</strong> {status.status}</p>
                                    <p><strong>Messages:</strong> {status.messages.join(', ')}</p>
                                    {status.actionsNeeded.length > 0 ? (
                                        <div>
                                            <p><strong>Actions Needed:</strong> {status.actionsNeeded.join(', ')}</p>
                                            {status.actionsNeeded.includes('Upload Document') && (
                                                <button onClick={() => setShowUploadDocumentModal(true)}>Open</button>
                                            )}
                                        </div>
                                    ) : (
                                        <p>No actions needed</p>
                                    )}
                                </div>
                            ))
                        ) : (
                            <p>No status updates available</p>
                        )}

                    </div>


                    <h4 style={{ marginTop: '2rem', marginBottom: '1rem' }}>Stakeholders List</h4>
                    <div className={'section-container'}>
                        <table>
                            <thead>
                                <tr>
                                    <th>First Name</th>
                                    <th>Surname</th>
                                    <th>Ethereum Address</th>
                                    <th>Token Balance</th>
                                    <th>Holding Percentage</th>
                                </tr>
                            </thead>
                            <tbody>
                                {renderStakeholdersList()}
                            </tbody>
                        </table>
                    </div>



                    <h4 style={{ marginTop: '2rem', marginBottom: '1rem' }}>Financing Info</h4>
                    <div className='section-container'>
                        <p>
                            <strong>Contract Address: </strong>
                            {contract.tokenContractAddress ? (
                                <a href={`https://agung-testnet.subscan.io/token/${contract.tokenContractAddress}`} target="_blank" rel="noopener noreferrer">
                                    {`${contract.tokenContractAddress.substring(0, 6)}...${contract.tokenContractAddress.substring(contract.tokenContractAddress.length - 6)}`}
                                </a>
                            ) : (
                                'N/A'
                            )}
                        </p>
                        <p><strong>Contract Term: </strong> {contract.contractTerm ? `${contract.contractTerm} months` : 'N/A'}</p>
                        <p><strong>Revenue Share: </strong> {contract.revenueShare ? `${contract.revenueShare}%` : 'N/A'}</p>
                        <p><strong>Financing Goal:</strong> {contract.fundingGoal ? `$${contract.fundingGoal.toLocaleString()}` : 'N/A'}</p>
                        <p><strong>Share Supply: </strong>{contract.maxTokenSupply ? contract.maxTokenSupply : 'N/A'}</p>
                        <p><strong>Share Price: </strong> ${contract.tokenPrice ? contract.tokenPrice : 'N/A'}</p>
                    </div>


                    <h4 style={{ marginTop: '2rem', marginBottom: '1rem' }}>Funds Usage</h4>

                    {contract.fundingUsage && contract.fundingUsage.length > 0 ? (
                        contract.fundingUsage.map((usage, index) => (
                            <div className='section-container' key={index}>
                                <span><strong>Type: </strong>{usage.description}</span>
                                <span><strong>Amount: </strong>${usage.amount.toLocaleString()}</span>
                                <span><strong>Details:</strong> {usage.description}</span>
                            </div>
                        ))
                    ) : (
                        <p>No fund usage information available</p>
                    )}


                    <h4 style={{ marginTop: '2rem', marginBottom: '1rem' }} className={'section-header'}>Projected Revenue</h4>

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


                    <h4 style={{ marginTop: '2rem', marginBottom: '1rem' }}>Associated Assets</h4>

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


                    <h4 style={{ marginTop: '2rem', marginBottom: '1rem' }}>General Info</h4>
                    <div className={'section-container'}>
                        <p>{contract.projectDescription}</p>
                    </div>

                    <h4 style={{ marginTop: '2rem', marginBottom: '1rem' }}>Documents</h4>
                    <div className={'section-container'}>
                        <label href="/path/to/prospectus_template.pdf" download className="btn-link">Prospectus</label>
                        <label href="/path/to/prospectus_template.pdf" download className="btn-link">penomo Terms & Conditions</label>
                        <label href="/path/to/prospectus_template.pdf" download className="btn-link">Cost Informations</label>
                        <label href="/path/to/prospectus_template.pdf" download className="btn-link">Transfer of Future Revenues Agreement</label>
                    </div>



                </div>
            )}
            {showUploadDocumentModal && (
                <UploadDocumentModal
                    actionsNeeded={contract.statusUpdates[0].actionsNeeded}
                    onClose={() => setShowUploadDocumentModal(false)}
                />
            )}
        </div>
    );
};

export default ContractProgressItem;
