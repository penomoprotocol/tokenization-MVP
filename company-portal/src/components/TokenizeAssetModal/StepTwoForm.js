import React from 'react';

const StepTwoForm = ({
    assetValue, setAssetValue,
    revenueStreams, setRevenueStreams,
    addRevenueStream, deleteRevenueStream, handleRevenueStreamChange
}) => {
    const formatNumberWithSpaces = (value) => {
        // Remove existing spaces and commas, then add spaces for thousands separator
        // return value.replace(/[\s,]/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
        return value
    };

    const handleAssetValueChange = (e) => {
        const formattedValue = formatNumberWithSpaces(e.target.value);
        setAssetValue(formattedValue);
    };

    const handleRevenueAmountChange = (index, e) => {
        const formattedValue = formatNumberWithSpaces(e.target.value);
        handleRevenueStreamChange(index, 'amount', formattedValue);
    };

    return (
        <div>
            <h3>Asset Valuation</h3>
            <div className="form-group">
                <label htmlFor="assetValue">Purchase Value</label>
                <input
                    id="assetValue"
                    type="text" // Change input type to text
                    value={assetValue}
                    onChange={handleAssetValueChange} // Use the new handler
                    className="form-control"
                    placeholder="Amount ($)"
                />
            </div>

            {revenueStreams.map((stream, index) => (
                <div key={index} className="revenue-stream-group">
                    <div className="form-group">
                        <label htmlFor={`revenueName-${index}`}>Revenue Stream</label>
                        <input
                            id={`revenueName-${index}`}
                            type="text"
                            value={stream.name}
                            onChange={(e) => handleRevenueStreamChange(index, 'name', e.target.value)}
                            className="form-control"
                            placeholder="Name"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor={`revenueAmount-${index}`}>Projected Profit (During Contract Term)</label>
                        <input
                            id={`revenueAmount-${index}`}
                            type="text" // Change input type to text
                            value={stream.amount}
                            onChange={(e) => handleRevenueAmountChange(index, e)} // Use the new handler
                            className="form-control"
                            placeholder="Amount ($)"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor={`revenueDetails-${index}`}>Details</label>
                        <textarea
                            id={`revenueDetails-${index}`}
                            value={stream.details}
                            onChange={(e) => handleRevenueStreamChange(index, 'details', e.target.value)}
                            className="form-control"
                            placeholder="Please project revenues & expenses."
                        />
                    </div>
                    <div className="button-group">
                        <button
                            className="btn btn-secondary"
                            onClick={() => deleteRevenueStream(index)}
                        >
                            Delete Projected Profit
                        </button>
                    </div>
                </div>
            ))}
            <div className="button-group">
                <button
                    className="btn-penomo"
                    onClick={addRevenueStream}
                >
                    Add Projected Profit
                </button>
            </div>
        </div>
    );
};

export default StepTwoForm;
