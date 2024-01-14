import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Contracts.css';
import ContractProgressItem from './ContractProgressItem';
import TokenizeAssetModal from '../../components/TokenizeAssetModal/TokenizeAssetModal';

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

    const toggleContractDetails = contractId => {
        setSelectedContractId(selectedContractId === contractId ? null : contractId);
    };

    return (
        <div className="page-container">
            <h1 className="page-header">Your Contracts</h1>
            <button className="btn-penomo" onClick={handleTokenizeAsset}>Tokenize Asset</button>
            
            <div className="contracts-list">
                {contracts.map(contract => (
                    <div key={contract.tokenContractAddress} className="contract-item">
                        <ContractProgressItem
                            contract={contract}
                            onSelect={() => toggleContractDetails(contract.tokenContractAddress)}
                        />
                        {selectedContractId === contract.tokenContractAddress && (
                            <div className="contract-details">
                                <p>Service Contract Address: {contract.serviceContractAddress}</p>
                                <p>Liquidity Pool Balance: {contract.liquidityPoolBalance.agungBalance} AGUNG, {contract.liquidityPoolBalance.usdcBalance} USDC</p>
                                <h4>Associated Assets:</h4>
                                <ul>
                                    {contract.assetDIDs.map((did, index) => (
                                        <li key={index}>{did}</li>
                                    ))}
                                </ul>
                                {/* Additional details here */}
                            </div>
                        )}
                    </div>
                ))}
            </div>
            {isModalOpen && <TokenizeAssetModal show={isModalOpen} handleClose={handleModalClose} />}
        </div>
    );
};

export default ContractsPage;

