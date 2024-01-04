import React, { useState } from 'react';

const StepFourForm = () => {
    const [securitizationContract, setSecuritizationContract] = useState(null);
    const [termsConditions, setTermsConditions] = useState(null);
    const [spvTemplate, setSpvTemplate] = useState(null);

    const handleFileChange = (setter) => (event) => {
        setter(event.target.files[0]);
    };

    return (
        <div>
            <h3>Contract and Agreement Templates</h3>
            <div>
                <a href="/path/to/securitization_contract.pdf" download>Download Securitization Contract</a>
                <input type="file" onChange={handleFileChange(setSecuritizationContract)} />
            </div>
            <div>
                <a href="/path/to/terms_conditions.pdf" download>Download Terms & Conditions</a>
                <input type="file" onChange={handleFileChange(setTermsConditions)} />
            </div>
            <div>
                <a href="/path/to/spv_template.pdf" download>Download SPV Template</a>
                <input type="file" onChange={handleFileChange(setSpvTemplate)} />
            </div>
        </div>
    );
};

export default StepFourForm;
