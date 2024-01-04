import React from 'react';

const ContractDetails = ({ contract }) => {
    return (
        <div>
            <h3>Contract Details</h3>
            <p>Name: {contract.name}</p>
            <p>Service Contract Address: {contract.serviceContractAddress}</p>
            <p>Liquidity Pool Balance: {contract.liquidityPoolBalance.agungBalance} AGUNG, {contract.liquidityPoolBalance.usdcBalance} USDC</p>
            <h4>Associated Assets:</h4>
            <ul>
                {contract.associatedAssets.map(asset => (
                    <li key={asset.DID.id}>{asset.name} (DID: {asset.DID.id})</li>
                ))}
            </ul>
        </div>
    );
};

export default ContractDetails;
