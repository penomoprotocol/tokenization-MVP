import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Contracts.css';
import ContractDetails from './ContractDetails';
import ContractListItem from './ContractListItem';

const Contracts = () => {
    const [contracts, setContracts] = useState([]);
    const [selectedContract, setSelectedContract] = useState(null);

    useEffect(() => {
        // Fetch contracts from the backend
        const fetchContracts = async () => {
            try {
                const response = await axios.get('/api/company/contracts');
                setContracts(response.data.contracts); // Adjust according to the response structure
            } catch (error) {
                console.error('Error fetching contracts:', error);
            }
        };

        fetchContracts();
    }, []);

    const handleContractSelect = (contract) => {
        setSelectedContract(contract);
    };

    const handleTokenizeAsset = () => {
        // Logic to handle asset tokenization
        // Implement or navigate to the asset tokenization page
    };

    return (
        <div className="page-container">
            <h1 className="page-header">Your Contracts</h1>
            <div className="section-container">
                {selectedContract && (
                    <ContractDetails contract={selectedContract} />
                )}

                <div>
                    <button className="btn-penomo" onClick={handleTokenizeAsset}>Tokenize Asset</button>
                </div>

                <div>
                    {contracts.map(contract => (
                        <ContractListItem
                            key={contract.tokenContractAddress} // Ensure unique key, adjust as per data
                            contract={contract}
                            onSelect={() => handleContractSelect(contract)}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Contracts
