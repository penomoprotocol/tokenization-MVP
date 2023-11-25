import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

// Importing page components
import Home from './pages/Home';
import RegistrationPage from './pages/RegistrationPage';
import LoginPage from './pages/LoginPage';
import InvestorDashboard from './pages/InvestorDashboard';
import Transactions from './pages/Transactions';
import Marketplace from './pages/Marketplace';

// Importing common components
import NavBar from './components/NavBar';
import Footer from './components/Footer';

// Importing auth provider
import { AuthProvider } from './services/AuthContext'; // Ensure this path is correct

// Importing styling
import './master.css';
import './App.css';
import './components/Footer.css';

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
                <Route path="/login" element={<LoginPage />} />
                <Route path="/dashboard" element={<InvestorDashboard />} />
                <Route path="/marketplace" element={<Marketplace />} />
                <Route path="/transaction-history" element={<Transactions />} />
                {/* <Route path="/update-profile" element={<ProfileUpdatePage />} />
                <Route path="/kyc-verification" element={<KYCVerificationPage />} /> */}
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
