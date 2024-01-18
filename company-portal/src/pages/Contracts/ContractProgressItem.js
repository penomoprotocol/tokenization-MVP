import React, { useState } from 'react';
import './ContractProgressItem.css';
import UploadDocumentModal from '../../components/UploadDocumentModal';


const ContractProgressItem = ({ contract, onSelect, isSelected }) => {
    const [showUploadDocumentModal, setShowUploadDocumentModal] = useState(false);

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
                <div className='center-vertical-group'><strong>Total Funding:</strong>  ${contract.fundingCurrent ? `$${contract.fundingCurrent}` : '0.00'}</div>
                <div className="progress-bar">
                    <div className="filler" style={{ width: `${(contract.fundingCurrent / contract.fundingGoal) * 100}%` }}></div>
                </div>
                <div className='center-vertical-group'><strong>Funding Goal:</strong> {contract.fundingGoal ? `$${contract.fundingGoal.toLocaleString()}` : 'N/A'}</div>
                <div className='center-vertical-group'><strong>Status:</strong> {contract.statusUpdates[0].status}</div>


                <span className="toggle-arrow">{isSelected ? '▲' : '▼'}</span>
            </div>



            {isSelected && (
                <div>
                    <div className={'section-container'}>
                        <h4>Funding Status</h4>
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
                    </div>

                    <div className='section-container'>
                        <h4>Funding Info</h4>
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
                        <p><strong>Funding Goal:</strong> {contract.fundingGoal ? `$${contract.fundingGoal.toLocaleString()}` : 'N/A'}</p>
                        <p><strong>Share Supply: </strong>{contract.maxTokenSupply ? contract.maxTokenSupply : 'N/A'}</p>
                        <p><strong>Share Price: </strong> ${contract.tokenPrice ? contract.tokenPrice : 'N/A'}</p>
                    </div>

                    <div className='section-container'>
                        <h4>Funding Usage</h4>
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
                    <div className={'section-container'}>
                        <h3>Documents</h3>
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
