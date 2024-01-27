import React, { useState } from 'react';

const StepFiveForm = () => {
    const [securitizationContract, setSecuritizationContract] = useState(null);
    const [termsConditions, setTermsConditions] = useState(null);
    const [prospectusTemplate, setProspectusTemplate] = useState(null);

    const handleFileChange = (setter) => (event) => {
        setter(event.target.files[0]);
    };

    return (
        <div>
            <h4>Please Upload the Following Documents:</h4>
            <div className="form-group">
                <label href="/path/to/securitization_contract.pdf" download >Business Plan</label>
                <input type="file" onChange={handleFileChange(setSecuritizationContract)} />
            </div>
            <div className="form-group">
                <label href="/path/to/securitization_contract.pdf" download >Financial Statements</label>
                <input type="file" onChange={handleFileChange(setSecuritizationContract)} />
            </div>
            <div className="form-group">
                <label href="/path/to/securitization_contract.pdf" download >Customer & Supplier Contracts</label>
                <input type="file" onChange={handleFileChange(setSecuritizationContract)} />
            </div>
            <h4 style={{marginTop:'2rem'}}>Please Download, Fill Out and Upload the Following Documents:</h4>
            <div className="form-group">
                <label href="/path/to/securitization_contract.pdf" download className="btn-link">Download Securitization Contract Template</label>
                <input type="file" onChange={handleFileChange(setSecuritizationContract)} />
            </div>
            <div className="form-group">
                <label href="/path/to/prospectus_template.pdf" download className="btn-link">Download Prospectus Template</label>
                <input type="file" onChange={handleFileChange(setProspectusTemplate)} />
            </div>
            <div className="form-group">
                < label href="/path/to/terms_conditions.pdf" download className="btn-link">Download Terms & Conditions</label>
                <input type="file" onChange={handleFileChange(setTermsConditions)} />
            </div>
        </div>
    );
};

export default StepFiveForm;
