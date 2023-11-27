// LoginModal.js
import React, { useState, useContext } from 'react';
import { Modal, Button } from 'react-bootstrap';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../services/AuthContext'; // Update the path as necessary

const LoginModal = ({ show, handleClose }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate(); // Initialize the navigate function

  const handleLogin = async (event) => {
    event.preventDefault();
    try {
      const response = await axios.post(`${process.env.REACT_APP_PENOMO_API}/api/investor/login`, { email, password });
      login(response.data.token); // Your context provider will handle the state
      localStorage.setItem('authToken', response.data.token); // Store the token in localStorage
      handleClose(); // Close the modal
      navigate('/dashboard'); // Redirect to the dashboard
    } catch (error) {
      setError('Invalid credentials or password.');
      console.error('Login error:', error);
    }
  };

  return (
    <Modal show={show} onHide={handleClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Login</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <form onSubmit={handleLogin}>
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
        <Link className="btn-penomo-navbar" onClick={handleLogin}>
          Login
        </Link>
      </Modal.Footer>
    </Modal>
  );
};

export default LoginModal;