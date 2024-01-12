// Imports
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Contracts.css';
import ContractProgressItem from './ContractProgressItem'; // Import the new component
import TokenizeAssetModal from '../../components/TokenizeAssetModal/TokenizeAssetModal';

const Contracts = () => {
    const [contracts, setContracts] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        const fetchContracts = async () => {
            try {
                const token = localStorage.getItem('authToken'); // Retrieve the JWT token from storage
                const config = {
                    headers: { Authorization: `Bearer ${token}` }
                };
                const response = await axios.get(`${process.env.REACT_APP_PENOMO_API}/api/token/get/companyId`, config); // Update the URL accordingly
                setContracts(response.data.contracts);
            } catch (error) {
                console.error('Error fetching contracts:', error);
                // Handle error
            }
        };

        fetchContracts();
    }, []);

    const handleTokenizeAsset = () => {
        setIsModalOpen(true);
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
    };

    return (
        <div className="page-container">
            <h1 className="page-header">Your Contracts</h1>
            <button className="btn-penomo" onClick={handleTokenizeAsset}>Tokenize Asset</button>
            <div className="contracts-list">
                {contracts.map(contract => (
                    <ContractProgressItem
                        key={contract.tokenContractAddress}
                        contract={contract}
                    />
                ))}
            </div>
            {isModalOpen && (
                <TokenizeAssetModal show={isModalOpen} handleClose={handleModalClose} />
            )}
        </div>
    );
};

export default Contracts;
