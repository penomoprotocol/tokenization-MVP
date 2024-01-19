import React from 'react';

const AssetCard = ({ companyData }) => {
    // Filter the tokens that have status "pending"
    const pendingTokens = companyData.tokens.filter(token => {
        // Assuming statusUpdates is an array, you can check if any status is "pending"
        return token.statusUpdates.some(statusUpdate => statusUpdate.status === "pending");
    });

    // Assign the total number of tokens to assetsInProgress
    const assetsInProgress = pendingTokens.length;
    const assetsListed = companyData.tokens.length-pendingTokens.length;

    return (
        <div style={{ marginLeft: "1rem" }} className="section-container">
            <h3>No. Of Assets</h3>
            <div className='two-columns'>
                <div className="colored-box center" style={{backgroundColor: "#00CC9C"}}>
                    <div style={{ fontSize: '2rem' }}>{assetsListed}</div>
                    <div>listed on penomo</div>
                </div>
                <div className="colored-box center" style={{backgroundColor: '#9bbab6'}}>
                    <div style={{ fontSize: '2rem' }}>{assetsInProgress}</div>
                    <div>in progress</div>
                </div>
            </div>
        </div>
    );
};

export default AssetCard;
