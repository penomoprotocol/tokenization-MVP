import React, { useEffect, useState } from 'react';

// Custom function to format numbers with a blank space for thousands separators
const formatNumberWithSpace = (number) => {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
};

const StepThreeForm = ({
    fundingGoal, setFundingGoal,
    fundingUsage, setFundingUsage,
    tokenAmount, setTokenAmount,
    tokenPrice, setTokenPrice
}) => {
    // Initialize the internal token price state with the initial value of 50
    const [internalTokenPrice, setInternalTokenPrice] = useState(50);

    // Calculate token amount based on funding goal and internal token price
    useEffect(() => {
        const calculatedTokenAmount = fundingGoal / internalTokenPrice;
        setTokenAmount(calculatedTokenAmount);
    }, [fundingGoal, internalTokenPrice, setTokenAmount]);

    // Handle token price change
    const handleTokenPriceChange = (value) => {
        setInternalTokenPrice(Number(value));
        setTokenPrice(Number(value));
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
                    value={formatNumberWithSpace(fundingGoal)} // Use custom formatting function
                    onChange={(e) => {
                        // Remove spaces and commas when the user edits the field
                        const formattedValue = e.target.value.replace(/[\s,]/g, '');
                        setFundingGoal(formattedValue);
                    }}
                    placeholder="Amount ($)"
                />
            </div>
            <div className="form-group">
                <label htmlFor="tokenPrice">Token Price ($)</label>
                <input
                    id="tokenPrice"
                    type="number"
                    className="form-control"
                    value={internalTokenPrice}
                    onChange={(e) => handleTokenPriceChange(e.target.value)}
                    placeholder="Enter token price"
                />
            </div>
            <div className="form-group">
                <label htmlFor="tokenAmount">Token Amount</label>
                <input
                    id="tokenAmount"
                    type="text" // Change input type to text
                    className="form-control"
                    value={formatNumberWithSpace(tokenAmount)} // Use custom formatting function
                    readOnly // Make the token amount field read-only
                />
            </div>

            <h3>Fund Usage</h3>
            {fundingUsage.map((usage, index) => (
                <div key={index} className="revenue-stream-group">
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
