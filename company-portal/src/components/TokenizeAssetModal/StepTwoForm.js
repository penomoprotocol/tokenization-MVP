import React from 'react';

const StepTwoForm = ({
    assetValue, setAssetValue,
    revenueStreams, setRevenueStreams,
    addRevenueStream, deleteRevenueStream, handleRevenueStreamChange
}) => {
    return (
        <div>
            <h3>Asset Evaluation</h3>
            <div className="form-group">
                <label htmlFor="assetValue">Purchase Value</label>
                <input
                    id="assetValue"
                    type="number"
                    value={assetValue}
                    onChange={(e) => setAssetValue(e.target.value)}
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
                        <label htmlFor={`revenueAmount-${index}`}>Projected Profit</label>
                        <input
                            id={`revenueAmount-${index}`}
                            type="number"
                            value={stream.amount}
                            onChange={(e) => handleRevenueStreamChange(index, 'amount', e.target.value)}
                            className="form-control"
                            placeholder="Amount ($)"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor={`revenueDetails-${index}`}>Details</label>
                        <input
                            id={`revenueDetails-${index}`}
                            type="text"
                            value={stream.details}
                            onChange={(e) => handleRevenueStreamChange(index, 'details', e.target.value)}
                            className="form-control"
                            placeholder="Revenues & Expenses"
                        />
                    </div>
                    <div className="button-group">
                        <button
                            className="btn btn-secondary"
                            onClick={() => deleteRevenueStream(index)}
                        >
                            Delete Revenue Stream
                        </button>
                    </div>
                </div>
            ))}
            <div className="button-group">
                <button
                    className="btn-penomo"
                    onClick={addRevenueStream}
                >
                    Add Revenue Stream
                </button>
            </div>
        </div>
    );
};

export default StepTwoForm;
