import React from 'react';
import './ContractProgressItem.css'; // Make sure to create appropriate CSS for this

const ContractProgressItem = ({ contract }) => {
    const financingPercentage = (contract.raisedAmount / contract.financingGoal) * 100;
    const daysUntilClosing = (new Date(contract.closingDate) - new Date()) / (1000 * 60 * 60 * 24);

    return (
        <div className="contract-progress-item">
            <h3>{contract.name}</h3>
            <p>Financing Goal: ${contract.financingGoal.toLocaleString()}</p>
            <div className="progress-bar-container">
                <div className="progress-bar" style={{ width: `${financingPercentage}%`, backgroundColor: '#yourPenomoColor' }}></div>
            </div>
            <p>{financingPercentage.toFixed(2)}% Raised</p>
            <p>{Math.round(daysUntilClosing)} days until financing closing</p>
        </div>
    );
};

export default ContractProgressItem;
