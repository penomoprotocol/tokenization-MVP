import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ContractProgressItem from './ContractProgressItem';
import TokenizeAssetModal from '../../components/TokenizeAssetModal/TokenizeAssetModal';
import './ContractsPage.css';

const ContractsPage = () => {
    const [contracts, setContracts] = useState([]);
    const [selectedContractId, setSelectedContractId] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const authToken = localStorage.getItem('authToken');

    useEffect(() => {
        const fetchCompanyData = async () => {
            if (authToken) {
                try {
                    const response = await axios.get(`${process.env.REACT_APP_PENOMO_API}/api/company/jwt`, {
                        headers: { Authorization: `Bearer ${authToken}` }
                    });
                    setContracts(response.data.tokens);
                } catch (error) {
                    console.error('Error fetching company data:', error);
                }
            }
        };

        fetchCompanyData();
    }, [authToken]);

    const handleTokenizeAsset = () => setIsModalOpen(true);
    const handleModalClose = () => setIsModalOpen(false);

    const toggleContractDetails = (contractId) => {
        setSelectedContractId((prevSelectedContractId) =>
            prevSelectedContractId === contractId ? null : contractId
        );
    };

    return (
        <div className="page-container">
            <h1 className="page-header">Your Contracts</h1>
            <div className="tokenize-button-container">
                <button className="btn-penomo" onClick={handleTokenizeAsset}>
                    Tokenize Asset
                </button>
            </div>
            <div className="contracts-list-container">
                {contracts.map((contract) => (
                    <div key={contract.tokenContractAddress} className="contract-item">
                        <ContractProgressItem
                            contract={contract}
                            onSelect={() => toggleContractDetails(contract.tokenContractAddress)}
                            isSelected={contract.tokenContractAddress === selectedContractId}
                        />
                    </div>
                ))}
            </div>
            {isModalOpen && <TokenizeAssetModal show={isModalOpen} handleClose={handleModalClose} />}
        </div>
    );
};

export default ContractsPage;
