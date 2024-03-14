// RegisterModal.js
import React, { useState } from 'react';
import { Modal } from 'react-bootstrap';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

const RegisterModal = ({ show, handleClose }) => {
  const [surname, setSurname] = useState('');
  const [firstname, setFirstname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isRegistering, setIsRegistering] = useState(false); // State to indicate registration process
  const navigate = useNavigate(); // For redirecting after successful registration

  const handleRegister = async (event) => {
    event.preventDefault();
    setIsRegistering(true); // Start the registration process
    try {
      await axios.post(`${process.env.REACT_APP_PENOMO_API}/api/investor/register`, {
        surname,
        firstname,
        email,
        password,
      });
      // If registration is successful, handle according to your needs
      handleClose(); // Close the modal
      navigate('/'); // Redirect to home or dashboard as needed
    } catch (error) {
      setError('There was an error registering the account.');
      console.error('Register error:', error);
      setIsRegistering(false); // Reset registration process indicator
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
            <label htmlFor="firstname" style={{color:"black"}} className="form-label">First Name:</label>
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
            <label htmlFor="surname" style={{color:"black"}} className="form-label">Surname:</label>
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
            <label htmlFor="email" style={{color:"black"}} className="form-label">Email:</label>
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
            <label htmlFor="password" style={{color:"black"}} className="form-label">Password:</label>
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
        {error && <div className="alert alert-danger" role="alert">{error}</div>}
      </Modal.Body>
      <Modal.Footer>
        <Link className="btn-secondary-navbar" onClick={handleClose} disabled={isRegistering}>
          Close
        </Link>
        <Link className="btn-penomo-navbar" onClick={handleRegister} disabled={isRegistering}>
          {isRegistering ? 'Wait...' : 'Register'}
        </Link>
      </Modal.Footer>
    </Modal>
  );
};

export default RegisterModal;