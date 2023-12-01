// App.js
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import axios from 'axios';

// Importing page components and ProtectedRoute
import Home from './pages/Home';
import RegistrationPage from './pages/RegistrationPage';
import InvestorDashboard from './pages/InvestorDashboard';
import Transactions from './pages/Transactions';
import Marketplace from './pages/Marketplace';

// Importing common components
import NavBar from './components/NavBar';
import Footer from './components/Footer';

// Importing auth services
import { AuthProvider } from './services/AuthContext'; 
import ProtectedRoute from './services/ProtectedRoute'; 


// Importing styling
import './master_dark.css';
import './App.css';
import './components/Footer.css';

// Set up HTTP headers for JWT requests
axios.defaults.headers.common['Authorization'] = `Bearer ${localStorage.getItem('authToken')}`;

function App() {
  return (
    <AuthProvider> {/* Wrap your application with AuthProvider */}
      <Router>
        <div id="root">
          <div className="footer-container">
            <div className="content-wrap">
              <NavBar />
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/register" element={<RegistrationPage />} />
                <Route 
                  path="/dashboard" 
                  element={
                    <ProtectedRoute>
                      <InvestorDashboard />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/marketplace" 
                  element={
                    <ProtectedRoute>
                      <Marketplace />
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
            <Footer />
          </div>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
