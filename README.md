# Tokenization MVP

This project is a Minimum Viable Product (MVP) for a tokenization platform developed by penomo Protocol. 
The platform aims to provide a secure and user-friendly platform for the tokenization of renewable energy assets, with a focus on regulatory compliance, market expansion, and enhanced liquidity for asset owners.

## Features

- **User Registration**: Renewable energy asset owners and investors can register and create an account on two dedicated portals.
- **KYC/AML Verification**: KYC/AML verification process for the user accounts.
- **Asset and Project Management**: Features for managing renewable energy assets and projects.
- **Marketplace Functionality**: Ability to list and purchase tokenized assets on a marketplace.

## Technology Stack

- **Frontend**: ReactJS
- **Backend**: Node.js with a REST API
- **Database**: MongoDB
- **Smart Contracts**: Solidity

## Getting Started

1. Clone the repository: `git clone https://github.com/penomoprotocol/tokenization-MVP.git`
2. Install dependencies: `npm install`
3. Configure environment variables: Create a `.env` file based on the provided `.env.example` file.
4. Start the development server: `npm start`

## Usage

- Register a new user account using the `/api/user/register` endpoint.
- Use the `/api/asset/register` endpoint to register a new asset.
- Deploy tokenization contracts using the `/api/token/deploy` endpoint.
- Access the platform's marketplace and manage assets and projects.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgements

- **Swagger**: Used for API documentation.
- **Web3Auth**: Used for passwordless authentication.

## Contact

For more information about this project, contact kubisch@penomo.com.
