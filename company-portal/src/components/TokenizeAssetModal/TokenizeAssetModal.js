import React, { useState } from 'react';
import StepOneForm from './StepOneForm';
import StepTwoForm from './StepTwoForm';
import StepThreeForm from './StepThreeForm';
import StepFourForm from './StepFourForm';

const TokenizeAssetModal = ({ closeModal }) => {
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
    // Other states for file uploads etc.

    const handleNextStep = () => {
        setStep(step + 1);
    };

    const handlePreviousStep = () => {
        setStep(step - 1);
    };

    const handleSubmit = () => {
        // Handle final submission logic here
        console.log('Submitting form data:', {
            assetType,
            capacity,
            power,
            location,
            assetValue,
            revenueStreams,
            financingGoal,
            fundUsage,
            tokenAmount,
            tokenPrice,
            contractName,
            contractStartDate,
            contractTerm,
            revenueShare
            // Other form data
        });
        closeModal();
    };

    return (
        <div className="modal-container">
            {/* Modal structure and styling */}
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

            <div>
                {step > 1 && <button onClick={handlePreviousStep}>Previous</button>}
                {step < 4 && <button onClick={handleNextStep}>Next</button>}
                {step === 4 && <button onClick={handleSubmit}>Submit</button>}
            </div>
        </div>
    );
};

export default TokenizeAssetModal;
