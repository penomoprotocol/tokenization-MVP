// Imports
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Contracts.css';
import ContractDetails from './ContractDetails';
import ContractListItem from './ContractListItem';
import TokenizeAssetModal from './TokenizeAssetModal'; // Import the modal component

const Contracts = () => {
    const [contracts, setContracts] = useState([]);
    const [selectedContract, setSelectedContract] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false); // State to manage modal open/close

    useEffect(() => {
        const fetchContracts = async () => {
            // Fetching logic
        };

        fetchContracts();
    }, []);

    const handleContractSelect = (contract) => {
        setSelectedContract(contract);
    };

    const handleTokenizeAsset = () => {
        setIsModalOpen(true); // Open the modal
    };

    const handleModalClose = () => {
        setIsModalOpen(false); // Close the modal
    };

    return (
        <div className="page-container">
            <h1 className="page-header">Your Contracts</h1>
            <div className="section-container">
                {selectedContract && (
                    <ContractDetails contract={selectedContract} />
                )}

                <button className="btn-penomo" onClick={handleTokenizeAsset}>Tokenize Asset</button>

                {contracts.map(contract => (
                    <ContractListItem
                        key={contract.tokenContractAddress}
                        contract={contract}
                        onSelect={() => handleContractSelect(contract)}
                    />
                ))}
            </div>

            {isModalOpen && (
                <TokenizeAssetModal closeModal={handleModalClose} />
            )}
        </div>
    );
};

export default Contracts;
