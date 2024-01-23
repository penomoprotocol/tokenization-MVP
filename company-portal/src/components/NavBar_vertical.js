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

import './NavBar_vertical.css';

const NavBar = () => {
    const { authToken } = useContext(AuthContext);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [showRegisterModal, setShowRegisterModal] = useState(false);
    const [showVerifyModal, setShowVerifyModal] = useState(false); // State for VerifyModal visibility
    const [isVerified, setIsVerified] = useState(true);
    const [companyId, setCompanyId] = useState(null);

    const handleLoginModalClose = () => setShowLoginModal(false);
    const handleLoginModalShow = () => setShowLoginModal(true);
    const handleRegisterModalClose = () => setShowRegisterModal(false);
    const handleRegisterModalShow = () => setShowRegisterModal(true);
    const handleVerifyModalShow = () => setShowVerifyModal(true);
    const handleVerifyModalClose = () => setShowVerifyModal(false);


    useEffect(() => {
        if (authToken) {
            const fetchCompanyData = async () => {
                try {
                    const response = await axios.get(`${process.env.REACT_APP_PENOMO_API}/api/company/jwt`, {
                        headers: { Authorization: `Bearer ${authToken}` }
                    });
                    console.log("Company Data: ", response);
                    setIsVerified(response.data.isVerified);
                    setCompanyId(response.data._id); // Store the company ID
                } catch (error) {
                    console.error('Error fetching company data:', error);
                    // Handle error appropriately
                }
            };
            fetchCompanyData();
        }
    }, [authToken]);


    const navStyle = {
        marginTop: '0', // Adjust this value as needed
        marginBottom: '0'
    };

    // Inline style to remove the margin and padding
    const navCollapseStyle = {
        marginTop: '0', // Adjust this value as needed
        paddingTop: '0', // Adjust this value as needed
    };

    const firstNavLinkStyle = {
        marginTop: '0', // Adjust this value as needed
        paddingTop: '0', // Adjust this value as needed
        marginBottom: '2rem' /* Adjust the space as needed */
    };
    const secondNavLinkStyle = {
        alignElements: 'center'
    };

 

    return (
        <Navbar bg="white" expand="lg" className="flex-column">
            <Navbar.Brand as={Link} to="/">
                <img src={logo} className="navbar-logo" alt="Penomo logo" />
            </Navbar.Brand>
            <Navbar.Toggle aria-controls="basic-navbar-nav" />
            {/* <Navbar.Collapse id="basic-navbar-nav" style={navCollapseStyle}> */}
            <Nav className="flex-column">

                {authToken && (
                    <>
                        <Link as={NavLink} to="/dashboard" className="btn-tertiary-navbar nav-button" style={{ marginTop: '1rem', alignItems: 'center' }}>Home</Link>
                        <Link as={NavLink} to="/contracts" className="btn-tertiary-navbar nav-button" style={{ marginTop: '1rem', alignItems: 'center' }}>Contracts</Link>
                        <Link as={NavLink} to="/transaction-history" className="btn-tertiary-navbar nav-button" style={{ marginTop: '1rem' }}>Transactions</Link>
                        <Link as={NavLink} to="/settings" className="btn-tertiary-navbar nav-button" style={{ marginTop: '1rem' }}>Settings</Link>
                    </>
                )}
                {!authToken && (
                    <>
                        <Link href="https://penomo.io" className="btn-tertiary-navbar nav-button" style={{ marginTop: '1rem' }}>Home Page</Link>
                        <Link href="https://penomo.notion.site" className="btn-tertiary-navbar nav-button" style={{ marginTop: '1rem' }}>Docs</Link>
                    </>
                )}

                {authToken ? (
                    <>
                        {!isVerified && (
                            <Link onClick={handleVerifyModalShow} className="btn-secondary-navbar nav-button" style={{ marginTop: '2rem' }}>Verify</Link>
                        )}
                        <Link to="#" className="btn-tertiary-navbar nav-button" style={{ marginTop: '2rem' }} >Contact Support</Link>
                        <Logout />
                    </>
                ) : (
                    <>
                        <Link onClick={handleLoginModalShow} style={{ marginTop: '2rem' }} className="btn-secondary-navbar nav-button">Login</Link>
                        <Link onClick={handleRegisterModalShow} style={{ marginTop: '1rem' }} className="btn-secondary-navbar nav-button">Register</Link>
                    </>
                )}
            </Nav>
            {/* </Navbar.Collapse> */}
            {/* Modals */}
            <LoginModal show={showLoginModal} handleClose={handleLoginModalClose} />
            <RegisterModal show={showRegisterModal} handleClose={handleRegisterModalClose} />
            <VerifyModal show={showVerifyModal} handleClose={handleVerifyModalClose} companyId={companyId} authToken={authToken} />
        </Navbar>
    );
};

export default NavBar;