import React from 'react';
import './ContractProgressItem.css'; // Assuming you have a separate CSS file for this component

const ContractProgressItem = ({ contract, onSelect, isSelected }) => {
    const financingGoal = contract.financingGoal || 0;
    const raisedAmount = contract.raisedAmount || 0;
    const closingDate = contract.closingDate ? new Date(contract.closingDate) : new Date();

    const financingPercentage = financingGoal > 0 ? (raisedAmount / financingGoal) * 100 : 0;
    const daysUntilClosing = Math.round((closingDate - new Date()) / (1000 * 60 * 60 * 24));

    return (
        <div className={`contract-progress-item ${isSelected ? 'selected' : ''}`} onClick={onSelect}>
            <div className="contract-header">
                <h3>{contract.name}</h3>
                <div className="contract-financial-info">
                    <p>Goal: ${financingGoal.toLocaleString()}</p>
                    <p>Raised: ${financingPercentage.toFixed(2)}%</p>
                    <p>Closing: ${daysUntilClosing >= 0 ? daysUntilClosing : 'Closed'} days</p>
                </div>
                <span className="toggle-arrow">{isSelected ? '▲' : '▼'}</span>
            </div>
            {isSelected && (
                <div className="contract-details">
                    {/* Additional Contract Details Here */}
                </div>
            )}
        </div>
    );
};

export default ContractProgressItem;
