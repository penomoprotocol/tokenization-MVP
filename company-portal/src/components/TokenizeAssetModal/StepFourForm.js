import React from 'react';

const StepFourForm = ({
    contractName, setContractName,
    contractStartDate, setContractStartDate,
    contractTerm, setContractTerm,
    revenueShare, setRevenueShare
}) => {
    return (
        <div>
            <h3>Contract Details</h3>
            <div className="form-group">
                <label htmlFor="contractName">Contract Name</label>
                <input
                    id="contractName"
                    type="text"
                    className="form-control"
                    value={contractName}
                    onChange={(e) => setContractName(e.target.value)}
                    placeholder="Contract Name"
                />
            </div>
            <div className="form-group">
                <label htmlFor="contractStartDate">Contract Start Date</label>
                <input
                    id="contractStartDate"
                    type="date"
                    className="form-control"
                    value={contractStartDate}
                    onChange={(e) => setContractStartDate(e.target.value)}
                    placeholder="Contract Start Date"
                />
            </div>
            <div className="form-group">
                <label htmlFor="contractTerm">Contract Term (Months)</label>
                <input
                    id="contractTerm"
                    type="number"
                    className="form-control"
                    value={contractTerm}
                    onChange={(e) => setContractTerm(e.target.value)}
                    placeholder="Contract Term (Months)"
                />
            </div>
            <div className="form-group">
                <label htmlFor="revenueShare">Revenue Share (%)</label>
                <input
                    id="revenueShare"
                    type="number"
                    className="form-control"
                    value={revenueShare}
                    onChange={(e) => setRevenueShare(e.target.value)}
                    placeholder="Revenue Share (%)"
                />
            </div>
        </div>
    );
};

export default StepFourForm;
