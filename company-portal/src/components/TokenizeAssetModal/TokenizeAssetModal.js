import React, { useState } from 'react';
import { Modal } from 'react-bootstrap';
import StepOneForm from './StepOneForm';
import StepTwoForm from './StepTwoForm';
import StepThreeForm from './StepThreeForm';
import StepFourForm from './StepFourForm';
import StepFiveForm from './StepFiveForm';

import axios from 'axios';

const TokenizeAssetModal = ({ show, handleClose}) => {
    // State for form data
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
        const updatedUsage = fundUsage.map((usage, i) => {
            if (i === index) {
                return { ...usage, [field]: value };
            }
            return usage;
        });
        setFundUsage(updatedUsage);
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
    try {
        // Assuming batteryName is one of the values to be sent
        const batteryName = model; // or another appropriate value

        const response = await axios.post('/api/asset/register', {
            assetType,
            brand,
            model,
            serialNumber,
            capacity,
            power,
            location,
            assetValue,
            revenueStreams,
            financingGoal,
            fundUsage
        });

        console.log('Asset Registration Response:', response.data);
        handleClose(); // Close the modal after submission
    } catch (error) {
        console.error('Error registering asset:', error);
        // Handle the error appropriately
    }
};


    // Modal structure with updated steps
    return (
        <Modal show={show} onHide={handleClose} centered>
            <Modal.Header closeButton>
                <Modal.Title>Tokenize Asset</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {step === 1 && (
                    <StepOneForm
                        assetType={assetType} setAssetType={setAssetType}
                        brand={brand} setBrand={setBrand}
                        model={model} setModel={setModel}
                        serialNumber={serialNumber} setSerialNumber={setSerialNumber}
                        capacity={capacity} setCapacity={setCapacity}
                        power={power} setPower={setPower}
                        location={location} setLocation={setLocation}
                    />
                )}
                {step === 2 && (
                    <StepTwoForm
                        assetValue={assetValue} setAssetValue={setAssetValue}
                        revenueStreams={revenueStreams}
                        setRevenueStreams={setRevenueStreams}
                        addRevenueStream={addRevenueStream}
                        deleteRevenueStream={deleteRevenueStream}
                        handleRevenueStreamChange={handleRevenueStreamChange}
                    />
                )}
                {step === 3 && (
                    <StepThreeForm
                        financingGoal={financingGoal} setFinancingGoal={setFinancingGoal}
                        fundUsage={fundUsage} setFundUsage={setFundUsage}
                        tokenAmount={tokenAmount} setTokenAmount={setTokenAmount}
                        tokenPrice={tokenPrice} setTokenPrice={setTokenPrice}
                        handleFundUsageChange={handleFundUsageChange}
                        addFundUsageItem={addFundUsageItem}
                    />
                )}
                {step === 4 && (
                    <StepFourForm
                        contractName={contractName} setContractName={setContractName}
                        contractStartDate={contractStartDate} setContractStartDate={setContractStartDate}
                        contractTerm={contractTerm} setContractTerm={setContractTerm}
                        revenueShare={revenueShare} setRevenueShare={setRevenueShare}
                    />
                )}
                {step === 5 && (
                    <StepFiveForm
                        contractName={contractName} setContractName={setContractName}
                        contractStartDate={contractStartDate} setContractStartDate={setContractStartDate}
                        contractTerm={contractTerm} setContractTerm={setContractTerm}
                        revenueShare={revenueShare} setRevenueShare={setRevenueShare}
                    />
                )}
            </Modal.Body>
            <Modal.Footer>
                {step > 1 && <button onClick={handlePreviousStep} className="btn-secondary-navbar">Previous</button>}
                {step < 5 && <button onClick={handleNextStep} className="btn-penomo-navbar">Next</button>}
                {step === 5 && <button onClick={handleSubmit} className="btn-penomo-navbar">Submit</button>}
            </Modal.Footer>
        </Modal>
    );
};

export default TokenizeAssetModal;
