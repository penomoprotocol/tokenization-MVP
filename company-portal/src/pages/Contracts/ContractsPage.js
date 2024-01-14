// Imports
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Contracts.css';
import ContractProgressItem from './ContractProgressItem';
import TokenizeAssetModal from '../../components/TokenizeAssetModal/TokenizeAssetModal';

const Contracts = () => {
    const [contracts, setContracts] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [companyId, setCompanyId] = useState('');
    const [isVerified, setIsVerified] = useState(false);

    const authToken = localStorage.getItem('authToken'); // Retrieve the JWT token from storage

    useEffect(() => {
        const fetchCompanyData = async () => {
            if (authToken) {
                try {
                    const response = await axios.get(`${process.env.REACT_APP_PENOMO_API}/api/company/jwt`, {
                        headers: { Authorization: `Bearer ${authToken}` }
                    });
                    //DEBUG
                    console.log("/api/company/jwt: ", response.data)
                    setCompanyId(response.data._id); // Store the company ID
                    setIsVerified(response.data.isVerified);
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

    return (
        <div className="page-container">
            <h1 className="page-header">Your Contracts</h1>
            <button className="btn-penomo" onClick={handleTokenizeAsset}>Tokenize Asset</button>
            <div className="contracts-list">
                {contracts.map(contract => (
                    <ContractProgressItem key={contract.tokenContractAddress} contract={contract} />
                ))}
            </div>
            {isModalOpen && <TokenizeAssetModal show={isModalOpen} handleClose={handleModalClose} />}
        </div>
    );
};

export default Contracts;
