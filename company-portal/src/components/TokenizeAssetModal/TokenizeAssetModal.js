import React, { useState } from 'react';
import { Modal } from 'react-bootstrap';
import StepOneForm from './StepOneForm';
import StepTwoForm from './StepTwoForm';
import StepThreeForm from './StepThreeForm';
import StepFourForm from './StepFourForm';
import StepFiveForm from './StepFiveForm';
import axios from 'axios';

const TokenizeAssetModal = ({ show, handleClose }) => {
    // State for form data and response
    const [assetType, setAssetType] = useState('');
    const [brand, setBrand] = useState('');
    const [model, setModel] = useState('');
    const [serialNumber, setSerialNumber] = useState('');
    const [capacity, setCapacity] = useState('');
    const [power, setPower] = useState('');
    const [location, setLocation] = useState('');
    const [assetValue, setAssetValue] = useState('');
    const [revenueStreams, setRevenueStreams] = useState([]);
    const [financingGoal, setFinancingGoal] = useState('');
    const [fundUsage, setFundUsage] = useState([{ amount: '', description: '' }]);
    const [tokenAmount, setTokenAmount] = useState('');
    const [tokenPrice, setTokenPrice] = useState('');
    const [contractName, setContractName] = useState('');
    const [contractStartDate, setContractStartDate] = useState('');
    const [contractTerm, setContractTerm] = useState('');
    const [revenueShare, setRevenueShare] = useState('');
    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [responseMessage, setResponseMessage] = useState('');

    // Functions to handle revenue streams
    const addRevenueStream = () => {
        setRevenueStreams([...revenueStreams, { name: '', amount: '', details: '' }]);
    };

    const deleteRevenueStream = (index) => {
        setRevenueStreams(revenueStreams.filter((_, i) => i !== index));
    };

    const handleRevenueStreamChange = (index, field, value) => {
        setRevenueStreams(revenueStreams.map((stream, i) => {
            if (i === index) {
                return { ...stream, [field]: value };
            }
            return stream;
        }));
    };

    // Functions to handle fund usage
    const handleFundUsageChange = (index, field, value) => {
        setFundUsage(fundUsage.map((usage, i) => {
            if (i === index) {
                return { ...usage, [field]: value };
            }
            return usage;
        }));
    };

    const addFundUsageItem = () => {
        setFundUsage([...fundUsage, { amount: '', description: '' }]);
    };

    // Helper functions to change step
    const handleNextStep = () => {
        setStep(prevStep => prevStep + 1);
    };

    const handlePreviousStep = () => {
        setStep(prevStep => prevStep - 1);
    };

    // Final submission function
    const handleSubmit = async () => {
        setIsSubmitting(true);

        try {
            // Asset registration data
            const assetData = {
                assetType, brand, model, serialNumber, capacity, power, location, assetValue, revenueStreams, financingGoal, fundUsage
            };

            // Get JWT token
            const token = localStorage.getItem('authToken');

            // Set Axios headers
            const config = {
                headers: { Authorization: `Bearer ${token}` }
            };

            // Register asset
            const assetResponse = await axios.post(`${process.env.REACT_APP_PENOMO_API}/api/asset/register`, assetData, config);
            const newAsset = assetResponse.data.newAsset;

            // Token deployment data
            const tokenData = {
                tokenName: contractName,
                tokenSymbol: contractName,
                tokenSupply: tokenAmount,
                tokenPrice,
                // TODO: Add functionality to choose currency
                paymentCurrency: 'USDC',
                contractTerm,
                revenueShare,
                DIDs: [newAsset.DID.document.id]
            };

            // Deploy token
            const tokenResponse = await axios.post(`${process.env.REACT_APP_PENOMO_API}/api/token/deploy`, tokenData, config);

            // Set response message
            setResponseMessage(`Your asset has been registered under the following DID: ${newAsset.DID.document.id}. Your Security Contract has been deployed under the following address: ${tokenResponse.data.newTokenEntry.tokenContractAddress}.`);
        } catch (error) {
            console.error('Error in process:', error);
            setResponseMessage('An error occurred during the process.');
        }

        setIsSubmitting(false);
    };

    return (
        <Modal show={show} onHide={handleClose} centered>
            <Modal.Header closeButton>
                <Modal.Title>Tokenize Asset</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {!responseMessage ? (
                    <>
                        {step === 1 && <StepOneForm {...{ assetType, setAssetType, brand, setBrand, model, setModel, serialNumber, setSerialNumber, capacity, setCapacity, power, setPower, location, setLocation }} />}
                        {step === 2 && <StepTwoForm {...{ assetValue, setAssetValue, revenueStreams, setRevenueStreams, addRevenueStream, deleteRevenueStream, handleRevenueStreamChange }} />}
                        {step === 3 && <StepThreeForm {...{ financingGoal, setFinancingGoal, fundUsage, setFundUsage, tokenAmount, setTokenAmount, tokenPrice, setTokenPrice, handleFundUsageChange, addFundUsageItem }} />}
                        {step === 4 && <StepFourForm {...{ contractName, setContractName, contractStartDate, setContractStartDate, contractTerm, setContractTerm, revenueShare, setRevenueShare }} />}
                        {step === 5 && <StepFiveForm {...{ contractName, setContractName, contractStartDate, setContractStartDate, contractTerm, setContractTerm, revenueShare, setRevenueShare }} />}
                    </>
                ) : (
                    <div style={{ padding: '20px', wordWrap: 'break-word' }}>{responseMessage}</div>
                )}
            </Modal.Body>
            <Modal.Footer>
                {!responseMessage ? (
                    <>
                        {step > 1 && <button onClick={handlePreviousStep} className="btn-secondary-navbar">Previous</button>}
                        {step < 5 && <button onClick={handleNextStep} className="btn-penomo-navbar">Next</button>}
                        {step === 5 && <button onClick={handleSubmit} className="btn-penomo-navbar" disabled={isSubmitting}>{isSubmitting ? 'Processing..' : 'Submit'}</button>}
                    </>
                ) : (
                    <button onClick={handleClose} className="btn-penomo-navbar">Close</button>
                )}
            </Modal.Footer>
        </Modal>
    );
};

export default TokenizeAssetModal;

