import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ContractDetails from './ContractDetails';
import ContractListItem from './ContractListItem';

const ContractsPage = () => {
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
        <div>
            {selectedContract && (
                <ContractDetails contract={selectedContract} />
            )}

            <div>
                <button onClick={handleTokenizeAsset}>Tokenize Asset</button>
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
    );
};

export default ContractsPage;
