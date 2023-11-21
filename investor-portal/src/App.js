import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

// Importing page components
import Home from './pages/Home';
import RegistrationPage from './pages/RegistrationPage';
import LoginPage from './pages/LoginPage';
import InvestorDashboard from './pages/InvestorDashboard';
import ProfileUpdatePage from './pages/ProfileUpdatePage';
import KYCVerificationPage from './pages/KYCVerificationPage';
import Transactions from './pages/Transactions';
import Marketplace from './pages/Marketplace';

// Importing common components
import NavBar from './components/NavBar';
import Footer from './components/Footer';

// Importing styling
import './master.css'
import './App.css'; 
import './components/Footer.css'; // Import the CSS for Footer

function App() {
  return (
    <div id="root">
      <div className="footer-container">
        <div className="content-wrap">
          <Router>
            <NavBar />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/register" element={<RegistrationPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/dashboard" element={<InvestorDashboard />} />
              <Route path="/marketplace" element={<Marketplace />} />
              <Route path="/update-profile" element={<ProfileUpdatePage />} />
              <Route path="/kyc-verification" element={<KYCVerificationPage />} />
              <Route path="/transaction-history" element={<Transactions />} />
            </Routes>
          </Router>
        </div>
        <Footer />
      </div>
    </div>
  );
}

export default App;
