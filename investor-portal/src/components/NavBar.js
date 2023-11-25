import React, { useContext } from 'react';
import { Navbar, Nav, Container } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import logo from '../assets/penomo_logo.svg'; // Make sure this path is correct

// Import Logout component and AuthContext
import Logout from './Logout'; // Update the path to your Logout component
import { AuthContext } from '../services/AuthContext'; // Update the path to your AuthContext

// Import styling
import './NavBar.css';

const NavBar = () => {
    const { authToken } = useContext(AuthContext); // Access the authentication token

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
                        <Nav.Link as={Link} to="/dashboard">Dashboard</Nav.Link>
                        <Nav.Link as={Link} to="/marketplace">Marketplace</Nav.Link>
                        <Nav.Link as={Link} to="/transaction-history">Transaction History</Nav.Link>
                    </Nav>
                    <Nav>
                        {authToken ? (
                            <Logout />
                        ) : (
                            <>
                                <Link to="/login" className="btn-penomo-navbar">Login</Link>
                                <Link to="/register" className="btn-secondary-navbar">Register</Link>
                            </>
                        )}
                    </Nav>
                </Navbar.Collapse>
            </Container>
        </Navbar>
    );
};

export default NavBar;
