// VerifyModal.js
import React, { useState } from 'react';
import { Modal, Button } from 'react-bootstrap';
import axios from 'axios';

const VerifyModal = ({ show, handleClose, investorId }) => {
  const [firstName, setFirstName] = useState('');
  const [surname, setSurname] = useState('');
  const [dob, setDob] = useState(''); // Date of birth
  const [passportId, setPassportId] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [verificationStatus, setVerificationStatus] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Add your data fields as needed for the request
      const response = await axios.post(`${process.env.REACT_APP_PENOMO_API}/api/investor/verify`, {
        investorId,
        // Add other data fields here
      });

      setVerificationStatus('Successfully verified. You can now start to invest!');
    } catch (error) {
      setVerificationStatus('Verification failed. Please try again.');
      console.error('Verification error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal show={show} onHide={handleClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>User Verification</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {verificationStatus ? (
          <p>{verificationStatus}</p>
        ) : (
          <form>
            {/* Input fields */}
            {/* ... Other input fields ... */}
          </form>
        )}
      </Modal.Body>
      <Modal.Footer>
        {verificationStatus ? (
          <Button onClick={handleClose}>Okay</Button>
        ) : (
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Processing...' : 'Submit'}
          </Button>
        )}
      </Modal.Footer>
    </Modal>
  );
};

export default VerifyModal;
