import React, { useEffect, useState } from 'react';

const StepThreeForm = ({
    financingGoal, setFinancingGoal,
    fundUsage, setFundUsage,
    tokenAmount, setTokenAmount,
    tokenPrice, setTokenPrice
}) => {
    // Initialize the internal token amount state with the external token amount
    const [internalTokenAmount, setInternalTokenAmount] = useState(tokenAmount || 1000000);

    useEffect(() => {
        // Update external token amount when internal token amount changes
        setTokenAmount(internalTokenAmount);
    }, [internalTokenAmount, setTokenAmount]);

    useEffect(() => {
        // Calculate and update token price when financing goal or internal token amount changes
        const calculatedTokenPrice = internalTokenAmount > 0 ? financingGoal / internalTokenAmount : 0;
        setTokenPrice(calculatedTokenPrice.toFixed(2)); // Keep two decimal places
    }, [financingGoal, internalTokenAmount, setTokenPrice]);

    // Handle token amount change
    const handleTokenAmountChange = (value) => {
        setInternalTokenAmount(Number(value));
        setTokenAmount(Number(value));
    };

    const handleFundUsageChange = (index, field, value) => {
        const updatedUsage = fundUsage.map((usage, i) => {
            if (i === index) {
                return { ...usage, [field]: value };
            }
            return usage;
        });
        setFundUsage(updatedUsage);
    };

    const addFundUsage = () => {
        setFundUsage([...fundUsage, { amount: '', description: '' }]);
    };

    const deleteFundUsage = (index) => {
        const updatedUsage = fundUsage.filter((_, i) => i !== index);
        setFundUsage(updatedUsage);
    };

    return (
        <div>
            <h3>Funding</h3>
            <div className="form-group">
                <label htmlFor="financingGoal">Funding Goal ($)</label>
                <input
                    id="financingGoal"
                    type="number"
                    className="form-control"
                    value={financingGoal}
                    onChange={(e) => setFinancingGoal(e.target.value)}
                    placeholder="Amount ($)"
                />
            </div>
            <div className="form-group">
                <label htmlFor="tokenAmount">Token Amount</label>
                <input
                    id="tokenAmount"
                    type="number"
                    className="form-control"
                    value={internalTokenAmount}
                    onChange={(e) => setInternalTokenAmount(Number(e.target.value))}
                    placeholder="Enter token amount"
                />
            </div>
            <div className="form-group">
                <label htmlFor="tokenPrice">Token Price ($)</label>
                <input
                    id="tokenPrice"
                    type="number"
                    className="form-control"
                    value={tokenPrice}
                    readOnly // Make the token price field read-only
                />
            </div>

            <h3>Fund Usage</h3>
            {fundUsage.map((usage, index) => (
                <div key={index} className='revenue-stream-group'>
                    <div className="form-group">
                        <label htmlFor={`fundAmount-${index}`}>Amount</label>
                        <input
                            id={`fundAmount-${index}`}
                            type="number"
                            className="form-control"
                            value={usage.amount}
                            onChange={(e) => handleFundUsageChange(index, 'amount', e.target.value)}
                            placeholder="Enter amount ($)"
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor={`fundDescription-${index}`}>Description</label>
                        <textarea
                            id={`fundDescription-${index}`}
                            className="form-control"
                            value={usage.description}
                            onChange={(e) => handleFundUsageChange(index, 'description', e.target.value)}
                            placeholder="Specify how you will use the funds."
                        />
                    </div>
                    <div className="button-group">
                        <button
                            className="btn btn-secondary"
                            onClick={() => deleteFundUsage(index)}
                        >
                            Delete Fund Usage
                        </button>
                    </div>
                </div>
            ))}
            <button onClick={addFundUsage} className="btn-penomo">Add Fund Usage</button>
        </div>
    );
};

export default StepThreeForm;
