import React from 'react';

const StepThreeForm = ({
    contractName, setContractName,
    contractStartDate, setContractStartDate,
    contractTerm, setContractTerm,
    revenueShare, setRevenueShare
}) => {
    return (
        <div>
            <h3>Contract Details</h3>
            <input
                type="text"
                value={contractName}
                onChange={(e) => setContractName(e.target.value)}
                placeholder="Contract Name"
            />
            <input
                type="date"
                value={contractStartDate}
                onChange={(e) => setContractStartDate(e.target.value)}
                placeholder="Contract Start Date"
            />
            <input
                type="number"
                value={contractTerm}
                onChange={(e) => setContractTerm(e.target.value)}
                placeholder="Contract Term (Months)"
            />
            <input
                type="number"
                value={revenueShare}
                onChange={(e) => setRevenueShare(e.target.value)}
                placeholder="Revenue Share (%)"
            />
        </div>
    );
};

export default StepThreeForm;
