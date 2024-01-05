import React from 'react';

const StepThreeForm = ({
    financingGoal, setFinancingGoal,
    fundUsage, setFundUsage,
    tokenAmount, setTokenAmount,
    tokenPrice, setTokenPrice
}) => {
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

    return (
        <div>
            <h3>Tokenization</h3>
            <div className="form-group">
                <label htmlFor="financingGoal">Financing Goal ($)</label>
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
                    value={tokenAmount}
                    onChange={(e) => setTokenAmount(e.target.value)}
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
                    onChange={(e) => setTokenPrice(e.target.value)}
                    placeholder="Enter token price"
                />
            </div>

            <h3>Fund Usage</h3>
            {fundUsage.map((usage, index) => (
                <div key={index} className="form-group">
                    <label htmlFor={`fundAmount-${index}`}>Amount ($)</label>
                    <input
                        id={`fundAmount-${index}`}
                        type="number"
                        className="form-control"
                        value={usage.amount}
                        onChange={(e) => handleFundUsageChange(index, 'amount', e.target.value)}
                        placeholder="Enter amount"
                    />
                    <label htmlFor={`fundDescription-${index}`}>Description</label>
                    <input
                        id={`fundDescription-${index}`}
                        type="text"
                        className="form-control"
                        value={usage.description}
                        onChange={(e) => handleFundUsageChange(index, 'description', e.target.value)}
                        placeholder="Enter description"
                    />
                </div>
            ))}
            <button onClick={addFundUsage} className="btn-penomo">Add Fund Usage</button>
        </div>
    );
};

export default StepThreeForm;
