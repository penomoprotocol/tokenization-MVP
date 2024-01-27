import React from 'react';

const StepFourForm = ({
    contractName, setContractName,
    projectDescription, setProjectDescription,
    tokenSymbol, setTokenSymbol,
    contractStartDate, setContractStartDate,
    contractTerm, setContractTerm,
    revenueShare, setRevenueShare
}) => {
    return (
        <div>
            <h3>General Specifications</h3>
            <div className="form-group">
                <label htmlFor="contractName">Project Name</label>
                <input
                    id="contractName"
                    type="text"
                    className="form-control"
                    value={contractName}
                    onChange={(e) => setContractName(e.target.value)}
                    placeholder="Enter Name"
                />
            </div>
            <div className="form-group">
                <label htmlFor="projectDescription">Project Description</label>
                <textarea
                    id="projectDescription"
                    className="form-control"
                    value={projectDescription}
                    onChange={(e) => setProjectDescription(e.target.value)}
                    placeholder="Enter a short description of your project."
                />
            </div>
            {/* <div className="form-group">
                <label htmlFor="tokenSymbol">Token Symbol</label>
                <input
                    id="tokenSymbol"
                    type="text"
                    className="form-control"
                    value={tokenSymbol}
                    onChange={(e) => setTokenSymbol(e.target.value)}
                    placeholder="Set Symbol"
                />
            </div> */}
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
                <label htmlFor="contractTerm">Contract Term</label>
                <input
                    id="contractTerm"
                    type="number"
                    className="form-control"
                    value={contractTerm}
                    onChange={(e) => setContractTerm(e.target.value)}
                    placeholder="Duration (Months)"
                />
            </div>
            <div className="form-group">
                <label htmlFor="revenueShare">Revenue Share</label>
                <input
                    id="revenueShare"
                    type="number"
                    className="form-control"
                    value={revenueShare}
                    onChange={(e) => setRevenueShare(e.target.value)}
                    placeholder="Percentage (%)"
                />
            </div>
        </div>
    );
};

export default StepFourForm;
