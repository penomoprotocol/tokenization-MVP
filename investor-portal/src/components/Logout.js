// Logout.js
import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from './AuthContext'; // Update the path to your AuthContext
import axios from 'axios';

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
    <button onClick={handleLogout} className="btn-penomo">Logout</button>
  );
};

export default Logout;
