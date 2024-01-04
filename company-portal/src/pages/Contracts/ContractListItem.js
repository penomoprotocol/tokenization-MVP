import React from 'react';

const ContractListItem = ({ contract, onSelect }) => {
    return (
        <div onClick={onSelect}>
            <h4>{contract.name}</h4>
            <p>Service Contract Address: {contract.serviceContractAddress}</p>
            <p>Associated Assets: {contract.associatedAssets.map(asset => asset.name).join(', ')}</p>
        </div>
    );
};

export default ContractListItem;
