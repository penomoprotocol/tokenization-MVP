import React, { useState } from 'react';
import { Modal, Form, Button } from 'react-bootstrap';
import axios from 'axios';

const VerifyModal = ({ show, handleClose, investorId, authToken }) => {
    const [firstName, setFirstName] = useState('');
    const [surname, setSurname] = useState('');
    const [dob, setDob] = useState(''); // Date of birth
    const [passportId, setPassportId] = useState('');
    const [issueDate, setIssueDate] = useState('');
    const [expiryDate, setExpiryDate] = useState('');
    const [verificationStatus, setVerificationStatus] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const resetForm = () => {
        setFirstName('');
        setSurname('');
        setDob('');
        setPassportId('');
        setIssueDate('');
        setExpiryDate('');
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
            // Construct verification data object
            const verificationData = {
                investorId,
                firstName,
                surname,
                dob,
                passportId,
                issueDate,
                expiryDate,
            };
            console.log("Auth Token:", authToken);
            console.log("Investor ID:", investorId);
            // Call verification API endpoint
            const response = await axios.post(`${process.env.REACT_APP_PENOMO_API}/api/investor/verify`, verificationData, {
                headers: { Authorization: `Bearer ${authToken}` }
            });

            setVerificationStatus({
                message1: (
                    <span style={{color:"black"}}>
                        Successfully verified on Global State Contract. See tx{' '}
                        <a href={`https://agung-testnet.subscan.io/tx/${response.data.transactionHash}`} target="_blank" rel="noopener noreferrer">
                            here
                        </a>.
                    </span>
                ),
                message2: `You can now start to invest!`
            });


        } catch (error) {
            setVerificationStatus('Verification failed. Please try again.');
            console.error('Verification error:', error);
            setIsSubmitting(false); // Allow for retry
        }
    };

    return (
        <Modal show={show} onHide={handleModalClose} centered>
            <Modal.Header closeButton>
                <Modal.Title>User Verification</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form onSubmit={handleSubmit}>
                    {verificationStatus ? (
                        <div>
                            {verificationStatus.message1 && <p>{verificationStatus.message1}</p>}
                            {verificationStatus.message2 && <p>{verificationStatus.message2}</p>}
                        </div>
                    ) : (
                        <>
                            {/* First Name */}
                            <Form.Group className="mb-3">
                                <Form.Label style={{color:"black"}}>First Name</Form.Label>
                                <Form.Control type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
                            </Form.Group>

                            {/* Surname */}
                            <Form.Group className="mb-3">
                                <Form.Label style={{color:"black"}}>Surname</Form.Label>
                                <Form.Control type="text" value={surname} onChange={(e) => setSurname(e.target.value)} required />
                            </Form.Group>

                            {/* Date of Birth */}
                            <Form.Group className="mb-3">
                                <Form.Label style={{color:"black"}}>Date of Birth</Form.Label>
                                <Form.Control type="date" value={dob} onChange={(e) => setDob(e.target.value)} required />
                            </Form.Group>

                            {/* Passport ID */}
                            <Form.Group className="mb-3">
                                <Form.Label style={{color:"black"}}>Passport ID</Form.Label>
                                <Form.Control type="text" value={passportId} onChange={(e) => setPassportId(e.target.value)} required />
                            </Form.Group>

                            {/* Passport Issue Date */}
                            <Form.Group className="mb-3">
                                <Form.Label style={{color:"black"}}>Issue Date</Form.Label>
                                <Form.Control type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} required />
                            </Form.Group>

                            {/* Passport Expiry Date */}
                            <Form.Group className="mb-3">
                                <Form.Label style={{color:"black"}}>Expiry Date</Form.Label>
                                <Form.Control type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} required />
                            </Form.Group>
                            <Button variant="penomo-navbar" type="submit" disabled={isSubmitting}>
                                {isSubmitting ? 'Processing...' : 'Submit'}
                            </Button>
                        </>
                    )}
                </Form>
            </Modal.Body>
            <Modal.Footer>
                {verificationStatus && (
                    <Button variant="penomo-navbar" onClick={handleModalClose}>Okay</Button>
                )}
            </Modal.Footer>
        </Modal>
    );
};

export default VerifyModal;