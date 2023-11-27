// RegisterModal.js
import React, { useState } from 'react';
import { Modal, Button } from 'react-bootstrap';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';

const RegisterModal = ({ show, handleClose }) => {
  const [surname, setSurname] = useState('');
  const [firstname, setFirstname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate(); // For redirecting after successful registration

  const handleRegister = async (event) => {
    event.preventDefault();
    try {
      const response = await axios.post(`${process.env.REACT_APP_PENOMO_API}/api/investor/register`, {
        surname,
        firstname,
        email,
        password,
      });
      // If registration is successful, you might want to log the user in directly
      // For now, just closing the modal and possibly redirecting or giving a success message
      handleClose(); // Close the modal
      navigate('/dashboard'); // Redirect to dashboard or login page
      // Or show a success message/modal
    } catch (error) {
      setError('There was an error registering the account.');
      console.error('Register error:', error);
    }
  };

  return (
    <Modal show={show} onHide={handleClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Register</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <form onSubmit={handleRegister}>
          <div className="form-group">
            <label htmlFor="surname" className="form-label">Surname:</label>
            <input
              type="text"
              id="surname"
              className="form-control"
              value={surname}
              onChange={(e) => setSurname(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="firstname" className="form-label">First Name:</label>
            <input
              type="text"
              id="firstname"
              className="form-control"
              value={firstname}
              onChange={(e) => setFirstname(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="email" className="form-label">Email:</label>
            <input
              type="email"
              id="email"
              className="form-control"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password" className="form-label">Password:</label>
            <input
              type="password"
              id="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <div className="alert alert-danger" role="alert">{error}</div>}
        </form>
      </Modal.Body>
      <Modal.Footer>
        <Link className="btn-secondary-navbar" onClick={handleClose}>
          Close
        </Link>
        <Link className="btn-penomo-navbar"onClick={handleRegister}>
          Register
        </Link>
      </Modal.Footer>
    </Modal>
  );
};

export default RegisterModal;
