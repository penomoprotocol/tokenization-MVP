// Logout.js
import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../services/AuthContext'; // Update the path to your AuthContext
import axios from 'axios';

// Import styling
import '../components/NavBar.css';

const Logout = () => {
  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout(); // Your context provider will handle updating the state
    localStorage.removeItem('authToken'); // Remove the token from localStorage
    delete axios.defaults.headers.common['Authorization']; // Remove the auth header
    navigate('/login'); // Redirect to the login page
  };

  return (
    <button onClick={handleLogout} className="btn-penomo-navbar">Logout</button>
  );
};

export default Logout;
