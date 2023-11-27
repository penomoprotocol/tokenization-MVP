// NavBar.js
import React, { useContext, useState } from 'react';
import { Navbar, Nav, Container } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import logo from '../assets/penomo_logo.svg'; 

import Logout from './Logout'; 
import { AuthContext } from '../services/AuthContext'; 
import LoginModal from './LoginModal'; 
import RegisterModal from './RegisterModal'; 

// Import styling
import './NavBar.css';

const NavBar = () => {
    const { authToken } = useContext(AuthContext); // Access the authentication token
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [showRegisterModal, setShowRegisterModal] = useState(false);
    
    const handleLoginModalClose = () => setShowLoginModal(false);
    const handleLoginModalShow = () => setShowLoginModal(true);
    const handleRegisterModalClose = () => setShowRegisterModal(false);
    const handleRegisterModalShow = () => setShowRegisterModal(true);

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
                                <Nav.Link as={Link} to="/dashboard">Wallet</Nav.Link>
                                <Nav.Link as={Link} to="/marketplace">Marketplace</Nav.Link>
                                <Nav.Link as={Link} to="/transaction-history">Transaction History</Nav.Link>
                            </>
                        )}
                    </Nav>
                    <Nav>
                        {authToken ? (
                            <Logout />
                        ) : (
                            <>
                                <Link onClick={handleLoginModalShow} className="btn-penomo-navbar">Login</Link>
                                <Link onClick={handleRegisterModalShow}  className="btn-secondary-navbar">Register</Link>
                            </>
                        )}
                    </Nav>
                </Navbar.Collapse>
            </Container>
            <LoginModal show={showLoginModal} handleClose={handleLoginModalClose} />
            <RegisterModal show={showRegisterModal} handleClose={handleRegisterModalClose} />
        </Navbar>
    );
};

export default NavBar;
