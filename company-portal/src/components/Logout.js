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
    navigate('/'); // Redirect to the home page
  };

  return (
    <button onClick={handleLogout} className="btn-secondary-navbar nav-button" style={{marginTop: '1rem'}}>Logout</button>
  );
};

export default Logout;
