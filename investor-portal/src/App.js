import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

// Importing page components
import Home from './pages/Home';
import RegistrationPage from './pages/RegistrationPage';
import LoginPage from './pages/LoginPage';
import InvestorDashboard from './pages/InvestorDashboard';
import BuyTokensPage from './pages/BuyTokensPage';
import ProfileUpdatePage from './pages/ProfileUpdatePage';
import KYCVerificationPage from './pages/KYCVerificationPage';
import TransactionHistoryPage from './pages/TransactionHistoryPage';

// Importing common components
import NavBar from './components/NavBar';
import Footer from './components/Footer';

function App() {
  return (
    <Router>
      <NavBar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/register" element={<RegistrationPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<InvestorDashboard />} />
        <Route path="/buy-tokens" element={<BuyTokensPage />} />
        <Route path="/update-profile" element={<ProfileUpdatePage />} />
        <Route path="/kyc-verification" element={<KYCVerificationPage />} />
        <Route path="/transaction-history" element={<TransactionHistoryPage />} />
      </Routes>
      <Footer />
    </Router>
  );
}

export default App;
