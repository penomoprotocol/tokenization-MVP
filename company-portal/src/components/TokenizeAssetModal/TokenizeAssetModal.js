import React, { useState } from 'react';
import { Modal } from 'react-bootstrap';
import StepOneForm from './StepOneForm';
import StepTwoForm from './StepTwoForm';
import StepThreeForm from './StepThreeForm';
import StepFourForm from './StepFourForm';

const TokenizeAssetModal = ({ show, handleClose }) => {
    const [step, setStep] = useState(1);
    // State for form data
    const [assetType, setAssetType] = useState('');
    const [capacity, setCapacity] = useState('');
    const [power, setPower] = useState('');
    const [location, setLocation] = useState('');
    const [assetValue, setAssetValue] = useState('');
    const [revenueStreams, setRevenueStreams] = useState([]);
    const [financingGoal, setFinancingGoal] = useState('');
    const [fundUsage, setFundUsage] = useState([]);
    const [tokenAmount, setTokenAmount] = useState('');
    const [tokenPrice, setTokenPrice] = useState('');
    const [contractName, setContractName] = useState('');
    const [contractStartDate, setContractStartDate] = useState('');
    const [contractTerm, setContractTerm] = useState('');
    const [revenueShare, setRevenueShare] = useState('');
    // States for file uploads in StepFourForm

    const handleNextStep = () => {
        // Add validation if needed for each step
        setStep(step + 1);
    };

    const handlePreviousStep = () => {
        setStep(step - 1);
    };

    const handleSubmit = () => {
        // Implement the final submission logic here
        // For example, sending data to backend
        console.log('Form submission data:', {
            assetType,
            capacity,
            // ... and other form data
        });
        handleClose(); // Close the modal after submission
    };

    return (
        <Modal show={show} onHide={handleClose} centered>
            <Modal.Header closeButton>
                <Modal.Title>Tokenize Asset</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {step === 1 && (
                    <StepOneForm
                        assetType={assetType} setAssetType={setAssetType}
                        capacity={capacity} setCapacity={setCapacity}
                        power={power} setPower={setPower}
                        location={location} setLocation={setLocation}
                        assetValue={assetValue} setAssetValue={setAssetValue}
                        revenueStreams={revenueStreams} setRevenueStreams={setRevenueStreams}
                    />
                )}
                {step === 2 && (
                    <StepTwoForm
                        financingGoal={financingGoal} setFinancingGoal={setFinancingGoal}
                        fundUsage={fundUsage} setFundUsage={setFundUsage}
                        tokenAmount={tokenAmount} setTokenAmount={setTokenAmount}
                        tokenPrice={tokenPrice} setTokenPrice={setTokenPrice}
                    />
                )}
                {step === 3 && (
                    <StepThreeForm
                        contractName={contractName} setContractName={setContractName}
                        contractStartDate={contractStartDate} setContractStartDate={setContractStartDate}
                        contractTerm={contractTerm} setContractTerm={setContractTerm}
                        revenueShare={revenueShare} setRevenueShare={setRevenueShare}
                    />
                )}
                {step === 4 && (
                    <StepFourForm
                    // Props for file upload and other data
                    />
                )}

            </Modal.Body>
            <Modal.Footer>
                <div className="modal-navigation">
                    {step > 1 && <button onClick={handlePreviousStep} className="btn-secondary-navbar">Previous</button>}
                </div>
                <div className="modal-navigation">
                    {step < 4 && <button onClick={handleNextStep} className="btn-penomo-navbar">Next</button>}
                </div>
                {step === 4 && <button onClick={handleSubmit} className="btn-penomo-navbar">Submit</button>}
            </Modal.Footer>
        </Modal>
    );
};

export default TokenizeAssetModal;
