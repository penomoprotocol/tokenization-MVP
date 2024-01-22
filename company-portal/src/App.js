// App.js
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import axios from 'axios';

// Importing page components and ProtectedRoute
import Home from './pages/Home';
import RegistrationPage from './pages/RegistrationPage';
import CompanyDashboard from './pages/CompanyDashboard';
import Transactions from './pages/Transactions';
import Contracts from './pages/Contracts/ContractsPage';

// Importing common components
import NavBar from './components/NavBar_vertical';
import Footer from './components/Footer';

// Importing auth services
import { AuthProvider } from './services/AuthContext';
import ProtectedRoute from './services/ProtectedRoute';


// Importing styling
import './master.css';
import './App.css';
import './components/Footer.css';

// Set up HTTP headers for JWT requests
axios.defaults.headers.common['Authorization'] = `Bearer ${localStorage.getItem('authToken')}`;

const rootStyle = {
  display: 'flex',        // Use flex layout
  flexDirection: 'row',   // Arrange children in a row
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div id="root" style={rootStyle}>
          <NavBar />
          <div className="content-wrap">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/register" element={<RegistrationPage />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <CompanyDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/contracts"
                element={
                  <ProtectedRoute>
                    <Contracts />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/transaction-history"
                element={
                  <ProtectedRoute>
                    <Transactions />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </div>
        </div>
        <Footer />
      </Router>
    </AuthProvider>
  );
}

export default App;
