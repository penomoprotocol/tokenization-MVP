import React from 'react';

const CompanyCard = ({ companyData }) => {
    return (
        <div className="section-container">
            <h2>Company Information</h2>
            <p><strong>Business Name:</strong> {companyData.businessName}</p>
            <p><strong>Registration Number:</strong> {companyData.registrationNumber}</p>
            <p><strong>Email:</strong> {companyData.email}</p>
            <p><strong>Business Phone:</strong> {companyData.businessPhone}</p>
            {/* Add more company data fields as needed */}
        </div>
    );
};

export default CompanyCard;
