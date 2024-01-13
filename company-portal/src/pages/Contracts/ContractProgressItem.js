import React from 'react';

const ContractProgressItem = ({ contract }) => {
    const financingGoal = contract.financingGoal || 0;
    const raisedAmount = contract.raisedAmount || 0;
    const closingDate = contract.closingDate || new Date();

    const financingPercentage = (raisedAmount / financingGoal) * 100;
    const daysUntilClosing = (new Date(closingDate) - new Date()) / (1000 * 60 * 60 * 24);

    return (
        <div className="contract-progress-item">
            <h3>{contract.name}</h3>
            <p>Financing Goal: ${financingGoal.toLocaleString()}</p>
            <div className="progress-bar-container">
                <div className="progress-bar" style={{ width: `${financingPercentage}%`, backgroundColor: '#yourPenomoColor' }}></div>
            </div>
            <p>{financingPercentage.toFixed(2)}% Raised</p>
            <p>{Math.round(daysUntilClosing)} days until financing closing</p>
        </div>
    );
};

export default ContractProgressItem;
