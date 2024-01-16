import React, { useEffect, useState } from 'react';

// Custom function to format numbers with a blank space for thousands separators
const formatNumberWithSpace = (number) => {
    // return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return number  
};

const StepThreeForm = ({
    fundingGoal, setFundingGoal,
    fundingUsage, setFundingUsage,
    tokenAmount, setTokenAmount,
    tokenPrice, setTokenPrice
}) => {
    setTokenPrice(50);
    // Calculate token amount based on funding goal and token price
    useEffect(() => {
        const calculatedTokenAmount = fundingGoal / tokenPrice;
        setTokenAmount(calculatedTokenAmount);
    }, [fundingGoal, tokenPrice, setTokenAmount]);

    const handleTokenPriceChange = (value) => {
        setTokenPrice(value);
    };

    const handleFundingUsageChange = (index, field, value) => {
        const updatedUsage = fundingUsage.map((usage, i) => {
            if (i === index) {
                return { ...usage, [field]: value };
            }
            return usage;
        });
        setFundingUsage(updatedUsage);
    };

    const addFundingUsage = () => {
        setFundingUsage([...fundingUsage, { amount: '', description: '' }]);
    };

    const deleteFundingUsage = (index) => {
        const updatedUsage = fundingUsage.filter((_, i) => i !== index);
        setFundingUsage(updatedUsage);
    };

    return (
        <div>
            <h3>Funding</h3>
            <div className="form-group">
                <label htmlFor="fundingGoal">Funding Goal ($)</label>
                <input
                    id="fundingGoal"
                    type="text" // Change input type to text
                    className="form-control"
                    value={fundingGoal} // Use custom formatting function
                    onChange={(e) => {
                        setFundingGoal(e.target.value);
                    }}
                    placeholder="Amount ($)"
                />
            </div>
            <div className="form-group">
                <label htmlFor="tokenPrice">Ticket Size ($)</label>
                <input
                    id="tokenPrice"
                    type="number"
                    className="form-control"
                    value={tokenPrice}
                    onChange={(e) => handleTokenPriceChange(e.target.value)}
                    placeholder="Enter Fractional Investment Amount"
                />
            </div>
            <div className="form-group">
                <label htmlFor="tokenAmount">Ticket Amount</label>
                <input
                    id="tokenAmount"
                    type="text" // Change input type to text
                    className="form-control"
                    value={tokenAmount} // Use custom formatting function
                    readOnly // Make the token amount field read-only
                />
            </div>

            <h3>Fund Usage</h3>
            {fundingUsage.map((usage, index) => (
                <div key={index} className="section-container">
                    <div className="form-group">
                        <label htmlFor={`fundAmount-${index}`}>Amount</label>
                        <input
                            id={`fundAmount-${index}`}
                            type="text" // Change input type to text
                            className="form-control"
                            value={formatNumberWithSpace(usage.amount)} // Use custom formatting function
                            onChange={(e) => {
                                // Remove spaces and commas when the user edits the field
                                const formattedValue = e.target.value.replace(/[\s,]/g, '');
                                handleFundingUsageChange(index, 'amount', formattedValue);
                            }}
                            placeholder="Enter amount ($)"
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor={`fundDescription-${index}`}>Description</label>
                        <textarea
                            id={`fundDescription-${index}`}
                            className="form-control"
                            value={usage.description}
                            onChange={(e) => handleFundingUsageChange(index, 'description', e.target.value)}
                            placeholder="Specify how you will use the funds."
                        />
                    </div>
                    <div className="button-group">
                        <button
                            className="btn btn-secondary"
                            onClick={() => deleteFundingUsage(index)}
                        >
                            Delete Fund Usage
                        </button>
                    </div>
                </div>
            ))}
            <button onClick={addFundingUsage} className="btn-penomo">Add Fund Usage</button>
        </div>
    );
};

export default StepThreeForm;
