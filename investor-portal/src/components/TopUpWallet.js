const TopUpWallet = ({ companyAddress, closeModal, show }) => {

  // Close modal and clear message
  const handleClose = () => {
    closeModal();
  };

  if (!show) {
    return null;
  }

  return (
    <div className="popup">
      <div className="popup-content">
        <div className="popup-header">
          <h2>Top Up Wallet</h2>
        </div>
        <div>
          <p>Send funds to the following address to top up your wallet:</p>
        </div>
        <div className='margin-bottom-2rem'><strong>{companyAddress}</strong></div>
        <button className="btn-penomo btn-center " onClick={handleClose}>OK</button>
      </div>
    </div>
  );
};

export default TopUpWallet;
