
import React from 'react';

const StepTwoForm = ({
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
            <h3>Financial Goal</h3>
            <input
                type="number"
                value={financingGoal}
                onChange={(e) => setFinancingGoal(e.target.value)}
                placeholder="Financing Goal"
            />

            <h3>Fund Usage</h3>
            {fundUsage.map((usage, index) => (
                <div key={index}>
                    <input
                        type="number"
                        value={usage.amount}
                        onChange={(e) => handleFundUsageChange(index, 'amount', e.target.value)}
                        placeholder="Amount"
                    />
                    <input
                        type="text"
                        value={usage.description}
                        onChange={(e) => handleFundUsageChange(index, 'description', e.target.value)}
                        placeholder="Description"
                    />
                </div>
            ))}
            <button onClick={addFundUsage}>Add Fund Usage</button>

            <h3>Tokenization</h3>
            <input
                type="number"
                value={tokenAmount}
                onChange={(e) => setTokenAmount(e.target.value)}
                placeholder="Token Amount"
            />
            <input
                type="number"
                value={tokenPrice}
                onChange={(e) => setTokenPrice(e.target.value)}
                placeholder="Token Price"
            />
        </div>
    );
};

export default StepTwoForm;
