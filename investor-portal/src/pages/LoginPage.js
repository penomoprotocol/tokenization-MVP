// LoginPage.js
import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../services/AuthContext'; // Update the path as necessary

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogin = async (event) => {
    event.preventDefault();
    try {
      const response = await axios.post(`${process.env.REACT_APP_PENOMO_API}/api/investor/login`, { email, password });
      login(response.data.token); // Your context provider will handle the state
      localStorage.setItem('authToken', response.data.token); // Store the token in localStorage
      navigate('/dashboard'); // Redirect to the dashboard
    } catch (error) {
      setError('Invalid credentials or password.');
      console.error('Login error:', error);
    }
  };

  return (
    <div className="page-container full-center">
      <div className="section-container">
        <h1 className="page-header">Login</h1>
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
          {error && <div className="text-center">{error}</div>}
          <div className="text-center">
            <button type="submit" className="btn-penomo">Login</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
