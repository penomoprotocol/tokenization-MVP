import React from 'react';

const CompanyCard = ({ companyData }) => {
    return (
        <div style={{ display: 'flex', flexDirection: 'column' }} className="section-container">
            <div style={{ display: 'flex', alignItems: 'center' }}>
                <h2>Your Company</h2>
                <button className="btn-penomo" onClick={() => handleEditClick()} style={{ marginRight: '0rem' }}>Edit</button>
            </div>

            <p><strong>Business Name:</strong> {companyData.businessName}</p>
            <p><strong>Registration Number:</strong> {companyData.registrationNumber}</p>
            <p><strong>Email:</strong> {companyData.email}</p>
            <p><strong>Business Phone:</strong> {companyData.businessPhone}</p>
            {/* Add more company data fields as needed */}
        </div>
    );

    // Define the onClick handler for the Edit button
    const handleEditClick = () => {
        // Implement your edit functionality here, e.g., open a modal or navigate to an edit page
        console.log('Edit button clicked');
    };
};

export default CompanyCard;
