import React, { useState } from 'react';
import { Modal, Form, Button } from 'react-bootstrap';
import axios from 'axios';

const VerifyModal = ({ show, handleClose, companyId, authToken }) => {
    // Personal Information
    const [firstName, setFirstName] = useState('');
    const [surname, setSurname] = useState('');
    const [dob, setDob] = useState('');

    // Business Information
    const [businessName, setBusinessName] = useState('');
    const [registrationNumber, setRegistrationNumber] = useState('');
    const [businessAddress, setBusinessAddress] = useState('');
    const [businessPhone, setBusinessPhone] = useState('');

    const [verificationStatus, setVerificationStatus] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const resetForm = () => {
        // Reset Personal Information
        setFirstName('');
        setSurname('');
        setDob('');

        // Reset Business Information
        setBusinessName('');
        setRegistrationNumber('');
        setBusinessAddress('');
        setBusinessPhone('');

        setVerificationStatus('');
        setIsSubmitting(false);
    };

    const handleModalClose = () => {
        resetForm();
        handleClose();
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setIsSubmitting(true);
        try {
            const verificationData = {
                companyId,
                firstName,
                surname,
                dob,
                businessName,
                registrationNumber,
                businessAddress,
                businessPhone,
            };

            console.log("Auth Token:", authToken);
            console.log("Company ID:", companyId);

            await axios.post(`${process.env.REACT_APP_PENOMO_API}/api/company/verify`, verificationData, {
                headers: { Authorization: `Bearer ${authToken}` }
            });

            setVerificationStatus('Business verification successful.');
        } catch (error) {
            setVerificationStatus('Verification failed. Please try again.');
            console.error('Verification error:', error);
            setIsSubmitting(false); // Allow for retry
        }
    };

    return (
        <Modal show={show} onHide={handleModalClose} centered>
            <Modal.Header closeButton>
                <Modal.Title>Business Verification</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form onSubmit={handleSubmit}>
                    {verificationStatus ? (
                        <div><p>{verificationStatus}</p></div>
                    ) : (
                        <>
                            {/* Personal Information Fields */}
                            <Form.Group className="mb-3">
                                <Form.Label>First Name</Form.Label>
                                <Form.Control type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
                            </Form.Group>

                            <Form.Group className="mb-3">
                                <Form.Label>Surname</Form.Label>
                                <Form.Control type="text" value={surname} onChange={(e) => setSurname(e.target.value)} required />
                            </Form.Group>

                            <Form.Group className="mb-3">
                                <Form.Label>Date of Birth</Form.Label>
                                <Form.Control type="date" value={dob} onChange={(e) => setDob(e.target.value)} required />
                            </Form.Group>

                            {/* Business Information Fields */}
                            <Form.Group className="mb-3">
                                <Form.Label>Business Name</Form.Label>
                                <Form.Control type="text" value={businessName} onChange={(e) => setBusinessName(e.target.value)} required />
                            </Form.Group>

                            <Form.Group className="mb-3">
                                <Form.Label>Registration Number</Form.Label>
                                <Form.Control type="text" value={registrationNumber} onChange={(e) => setRegistrationNumber(e.target.value)} required />
                            </Form.Group>

                            <Form.Group className="mb-3">
                                <Form.Label>Business Address</Form.Label>
                                <Form.Control type="text" value={businessAddress} onChange={(e) => setBusinessAddress(e.target.value)} required />
                            </Form.Group>

                            <Form.Group className="mb-3">
                                <Form.Label>Business Phone</Form.Label>
                                <Form.Control type="tel" value={businessPhone} onChange={(e) => setBusinessPhone(e.target.value)} required />
                            </Form.Group>

                            <Button variant="penomo-navbar" type="submit" disabled={isSubmitting}>
                                {isSubmitting ? 'Processing...' : 'Submit'}
                            </Button>
                        </>
                    )}
                </Form>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="penomo-navbar" onClick={handleModalClose}>Close</Button>
            </Modal.Footer>
        </Modal>
    );
};

export default VerifyModal;
