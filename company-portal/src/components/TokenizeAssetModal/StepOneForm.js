import React from 'react';

const StepOneForm = ({
    assetType, setAssetType,
    capacity, setCapacity,
    power, setPower,
    location, setLocation,
    assetValue, setAssetValue,
    revenueStreams, setRevenueStreams
}) => {
    const handleRevenueStreamChange = (index, field, value) => {
        const updatedStreams = revenueStreams.map((stream, i) => {
            if (i === index) {
                return { ...stream, [field]: value };
            }
            return stream;
        });
        setRevenueStreams(updatedStreams);
    };

    const addRevenueStream = () => {
        setRevenueStreams([...revenueStreams, { name: '', amount: '', details: '' }]);
    };

    const deleteRevenueStream = (index) => {
        const updatedStreams = revenueStreams.filter((_, i) => i !== index);
        setRevenueStreams(updatedStreams);
    };

    return (
        <div>
            <h3>Asset Details</h3>
            <div className="form-group">
                <label htmlFor="assetType">Select Asset Type</label>
                <select
                    id="assetType"
                    value={assetType}
                    onChange={(e) => setAssetType(e.target.value)}
                    className="form-control"
                >
                    <option value="">Select Asset Type</option>
                    <option value="battery">Battery Storage</option>
                    <option value="solar">Solar Plant</option>
                    <option value="windTurbine">Wind Turbine</option>
                </select>
            </div>

            {assetType === 'battery' && (
                <div className="form-group">
                    <label htmlFor="capacity">Capacity (kWh)</label>
                    <input
                        id="capacity"
                        type="text"
                        value={capacity}
                        onChange={(e) => setCapacity(e.target.value)}
                        className="form-control"
                        placeholder="Capacity (kWh)"
                    />
                </div>
            )}

            {(assetType === 'solar' || assetType === 'windTurbine') && (
                <div className="form-group">
                    <label htmlFor="power">Power (kW)</label>
                    <input
                        id="power"
                        type="text"
                        value={power}
                        onChange={(e) => setPower(e.target.value)}
                        className="form-control"
                        placeholder="Power (kW)"
                    />
                </div>
            )}
            {(assetType) && (
                <div className="form-group">
                    <label htmlFor="location">Location (Country)</label>
                    <input
                        id="location"
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="form-control"
                        placeholder="Location (Country)"
                    />
                </div>
            )}

            <div className="asset-evaluation-group">
                <h4>Asset Evaluation</h4>
                <div className="form-group">
                    <label htmlFor="assetValue">Purchase Value ($)</label>
                    <input
                        id="assetValue"
                        type="text"
                        value={assetValue}
                        onChange={(e) => setAssetValue(e.target.value)}
                        className="form-control"
                        placeholder="Asset Value ($)"
                    />
                </div>

                {revenueStreams.map((stream, index) => (
                    <div key={index} className="revenue-stream-group">
                        <div className="form-group">
                            <label htmlFor={`revenueName-${index}`}>Revenue Stream Name</label>
                            <input
                                id={`revenueName-${index}`}
                                type="text"
                                value={stream.name}
                                onChange={(e) => handleRevenueStreamChange(index, 'name', e.target.value)}
                                className="form-control"
                                placeholder="Revenue Stream Name"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor={`revenueAmount-${index}`}>Projected Profit ($)</label>
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
                                placeholder="Details"
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
        </div>
    );
};

export default StepOneForm;
