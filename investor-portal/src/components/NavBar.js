import React, { useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { Navbar, Nav, Container } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import logo from '../assets/penomo_logo.svg';
import { NavLink } from 'react-router-dom';

import Logout from './Logout';
import { AuthContext } from '../services/AuthContext';
import LoginModal from './LoginModal';
import RegisterModal from './RegisterModal';
import VerifyModal from './VerifyModal'; // Import the VerifyModal component

import './NavBar.css';

const NavBar = () => {
    const { authToken } = useContext(AuthContext);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [showRegisterModal, setShowRegisterModal] = useState(false);
    const [showVerifyModal, setShowVerifyModal] = useState(false); // State for VerifyModal visibility
    const [isVerified, setIsVerified] = useState(true);
    const [investorId, setInvestorId] = useState(null);

    const handleLoginModalClose = () => setShowLoginModal(false);
    const handleLoginModalShow = () => setShowLoginModal(true);
    const handleRegisterModalClose = () => setShowRegisterModal(false);
    const handleRegisterModalShow = () => setShowRegisterModal(true);
    const handleVerifyModalShow = () => setShowVerifyModal(true);
    const handleVerifyModalClose = () => setShowVerifyModal(false);

    useEffect(() => {
        if (authToken) {
            const fetchInvestorData = async () => {
                try {
                    const response = await axios.get(`${process.env.REACT_APP_PENOMO_API}/api/investor/jwt`, {
                        headers: { Authorization: `Bearer ${authToken}` }
                    });
                    console.log("Investor Data: ", response);
                    setIsVerified(response.data.isVerified);
                    setInvestorId(response.data._id); // Store the investor ID
                } catch (error) {
                    console.error('Error fetching investor data:', error);
                    // Handle error appropriately
                }
            };
            fetchInvestorData();
        }
    }, [authToken]);

    return (
        <Navbar bg="light" expand="lg">
            <Container>
                <Navbar.Brand as={Link} to="/">
                    <img
                        src={logo}
                        className="navbar-logo"
                        alt="Penomo logo"
                    />
                </Navbar.Brand>
                <Navbar.Toggle aria-controls="basic-navbar-nav" />
                <Navbar.Collapse id="basic-navbar-nav">
                    <Nav className="me-auto">
                        {authToken && (
                            <>
                                <Nav.Link as={NavLink} to="/dashboard" activeStyle={{ fontWeight: "bold" }}>Wallet</Nav.Link>
                                <Nav.Link as={NavLink} to="/marketplace" activeStyle={{ fontWeight: "bold" }}>Platform</Nav.Link>
                                <Nav.Link as={NavLink} to="/transaction-history" activeStyle={{ fontWeight: "bold" }}>Transaction History</Nav.Link>
                            </>
                        )}
                    </Nav>
                    <Nav>
                        {authToken ? (
                            <>
                                {!isVerified && (
                                    <Link onClick={handleVerifyModalShow} className="btn-secondary-navbar">Verify</Link>
                                )}
                                <Logout />
                            </>
                        ) : (
                            <>
                                <Link onClick={handleLoginModalShow} className="btn-penomo-navbar">Login</Link>
                                <Link onClick={handleRegisterModalShow} className="btn-secondary-navbar">Register</Link>
                            </>
                        )}
                    </Nav>
                </Navbar.Collapse>
            </Container>
            <LoginModal show={showLoginModal} handleClose={handleLoginModalClose} />
            <RegisterModal show={showRegisterModal} handleClose={handleRegisterModalClose} />
            <VerifyModal 
                show={showVerifyModal} 
                handleClose={handleVerifyModalClose} 
                investorId={investorId} 
                authToken={authToken}
            />
        </Navbar>
    );
};

export default NavBar;
