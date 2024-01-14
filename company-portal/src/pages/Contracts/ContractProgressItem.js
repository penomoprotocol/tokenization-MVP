import React from 'react';
// import './ContractProgressItem.css'; // Assuming you have a separate CSS file for this component

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
                <span className="toggle-arrow">{isSelected ? '▲' : '▼'}</span>
            </div>
            <div className="contract-body">
                <div className="contract-info">
                    <p>Fin
                        ancing Goal: ${financingGoal.toLocaleString()}</p>
                    <div className="progress-bar-container">
                        <div className="progress-bar" style={{ width: `${financingPercentage}%`, backgroundColor: '#yourPenomoColor' }}></div>
                    </div>
                    <p>${financingPercentage.toFixed(2)}% Raised</p>
                    <p>${daysUntilClosing >= 0 ? daysUntilClosing : 'Closed'} days until financing closing</p>
                </div>
            </div>
        </div>
    );
};

export default ContractProgressItem;