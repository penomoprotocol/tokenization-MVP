import React, { useState } from 'react';

const UploadDocumentModal = ({ actionsNeeded, onClose }) => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploadStatus, setUploadStatus] = useState(null);

    const handleFileSelect = (e) => {
        setSelectedFile(e.target.files[0]);
    };

    const handleUpload = async () => {
        if (!selectedFile) {
            return;
        }

        // Add your file upload logic here, e.g., using FormData and API request
        const formData = new FormData();
        formData.append('file', selectedFile);

        try {
            // Send the file to the server for processing
            // You can use fetch or an Axios request here
            // Handle the success or error response
            // For example, display a success message or error message
            setUploadStatus('File uploaded successfully.');
        } catch (error) {
            // Handle the error and display an error message
            setUploadStatus('Error uploading file.');
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal">
                <h2>Upload Document</h2>
                <p>Actions Needed: {actionsNeeded.join(', ')}</p>
                <input type="file" accept=".pdf,.doc,.docx" onChange={handleFileSelect} />
                <button onClick={handleUpload}>Upload</button>
                <p>{uploadStatus}</p>
                <button onClick={onClose}>Close</button>
            </div>
        </div>
    );
};

export default UploadDocumentModal;
