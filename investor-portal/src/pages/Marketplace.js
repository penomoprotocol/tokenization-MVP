import React, { useState, useEffect } from 'react';
import axios from 'axios';
import BuyTokens from '../components/BuyTokens'; // Make sure this is correctly imported

import './Marketplace.css'; // Ensure this CSS file has the .btn-penomo class

const Marketplace = () => {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);

  useEffect(() => {
    // Mock data for projects. Replace with actual API call.
    const sampleProjects = [
        {
          id: 1,
          name: 'Battery Storage Berlin',
          description: 'A sustainable battery storage project in Berlin.',
          capacity: '1000',
          contractTerm: '12',
          maxSupply: '100000',
          tokenPrice: '10.50'
        },
        {
          id: 2,
          name: 'Battery Storage Munich',
          description: 'A sustainable battery storage project in Munich.',
          capacity: '100',
          contractTerm: '24',
          maxSupply: '100000',
          tokenPrice: '10.30'
        },
        {
          id: 3,
          name: 'Battery Storage Delhi',
          description: 'A sustainable battery storage project in Delhi. Delhi also has spicy food and curries.',
          capacity: '10000',
          contractTerm: '6',
          maxSupply: '10000000',
          tokenPrice: '8.20'
        },
        {
          id: 4,
          name: 'Battery Storage Mumbai',
          description: 'A sustainable battery storage project in Mumbai. If you are in Mumbai, eat Vadapao!',
          capacity: '100',
          contractTerm: '10',
          maxSupply: '100000',
          tokenPrice: '10'
        },
        {
          id: 5,
          name: 'Battery Storage Stockholm',
          description: 'A sustainable battery storage project in Sweden.',
          capacity: '100',
          contractTerm: '8',
          maxSupply: '100000',
          tokenPrice: '10'
        },
      ];

    setProjects(sampleProjects);
  }, []);

  // Function to open the BuyTokens modal
  const handleBuyTokensClick = (project) => {
    setSelectedProject(project);
  };

  // Function to close the BuyTokens modal
  const handleCloseModal = () => {
    setSelectedProject(null);
  };

  return (
    <div className="page-container">
      <h1 className="section-header">Marketplace</h1>
      <div className="row">
        {projects.map((project) => (
          <div key={project.id} className="col-12 col-md-6 col-lg-4 mb-4">
            <div className="section-container h-100">
              <div className="card-content">
                <h2>{project.name}</h2>
                <p>{project.description}</p>
                <ul>
                  <li>Capacity: {project.capacity} MW</li>
                  <li>Contract Term: {project.contractTerm} months</li>
                  <li>Max Supply: {project.maxSupply} tokens</li>
                  <li>Token Price: ${project.tokenPrice}</li>
                </ul>
              </div>
              <button
                  className="btn-penomo"
                  onClick={() => handleBuyTokensClick(project)}
                >
                  Buy Tokens
                </button>
              </div>
            </div>
        ))}
      </div>

      {selectedProject && (
        <BuyTokens
          project={selectedProject}
          closeModal={handleCloseModal}
          show={!!selectedProject} // This prop controls the visibility of the modal
        />
      )}
    </div>
  );
};


export default Marketplace;
