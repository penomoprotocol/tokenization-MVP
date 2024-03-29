import React from 'react';

function roundToDecimals(numStr, decimals) {
    let num = parseFloat(numStr);
    if (isNaN(num)) {
        return 'Invalid input';
    }

    return num.toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    });
}

// Function to sum up all token balances
const sumTokenBalances = (tokens) => {
    return tokens.reduce((accumulator, token) => {
        // Ensure that the balance is a number before adding it to the accumulator
        const balance = parseFloat(token.liquidityPoolBalance.usdcBalance);
        return accumulator + (isNaN(balance) ? 0 : balance);
    }, 0); // Start the accumulation from 0
};


const AssetCard = ({ companyData }) => {
    // Filter the tokens that have status "pending"
    const pendingTokens = companyData.tokens.filter(token => {
        // Assuming statusUpdates is an array, you can check if any status is "Pending"
        return token.statusUpdates.some(statusUpdate => statusUpdate.status === "Pending");
    });


    const totalBalance = companyData && companyData.tokens.length > 0
        ? roundToDecimals(sumTokenBalances(companyData.tokens), 2)
        : '0.00';

    return (
        <div style={{ marginRight: "1rem", paddingBottom: '4rem', display: 'flex', flex: '1' }} className="section-container">
            <h3>Total Financing Received</h3>
            <div style={{ marginTop: '2rem' }} className="label-value-horizontal">
                <div className="balance-title" style={{ fontSize: "2rem" }}>$</div>
                <span className="balance-amount" style={{ fontSize: "2rem" }}>{totalBalance}</span>
            </div>
        </div>
    );
};

export default AssetCard;
