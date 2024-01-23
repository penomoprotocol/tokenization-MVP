import React from 'react';

function roundToDecimals(str, x) {
    let num = parseFloat(str);
    if (isNaN(num)) {
        return 'Invalid input';
    }
    if (num < 1 && num % 1 !== 0) {
        let num_mul = num;
        let decimalPlaces = 0;
        while (num_mul < 1) {
            num_mul = num_mul * 10;
            decimalPlaces = decimalPlaces + 1;
        }
        const totalDigits = decimalPlaces + 1;
        return num.toFixed(Math.max(totalDigits, x));
    } else {
        return num.toFixed(x);
    }
}

const AssetCard = ({ companyData }) => {
    // Filter the tokens that have status "pending"
    const pendingTokens = companyData.tokens.filter(token => {
        // Assuming statusUpdates is an array, you can check if any status is "Pending"
        return token.statusUpdates.some(statusUpdate => statusUpdate.status === "Pending");
    });


    return (
        <div style={{ marginRight: "1rem", paddingBottom:'4rem', display: 'flex', flex:'1'}} className="section-container">
            <h3>Total Balance</h3>
            <div style={{marginTop:'2rem'}} className="label-value-horizontal">
                <div className="balance-title" style={{ fontSize: "2rem" }}>$</div>
                <span className="balance-amount" style={{ fontSize: "2rem" }}>{roundToDecimals(companyData.balances.usdcBalance, 2)}</span>
            </div>
        </div>
    );
};

export default AssetCard;
