// AssetCard.js
import React from 'react';

const AssetCard = ({ totalAssets, assetsInProgress }) => {
    return (
        <div className="section-container">
            <h3>No. Of Assets</h3>
            <p>{totalAssets} listed on penomo</p>
            <p>{assetsInProgress} in progress</p>
        </div>
    );
};

export default AssetCard;
