import React from 'react';

const StepOneForm = ({
    assetType, setAssetType,
    brand, setBrand,
    model, setModel,
    serialNumber, setSerialNumber,
    capacity, setCapacity,
    power, setPower,
    location, setLocation
}) => {
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
                    <option value="Mobile Battery Storage">Mobile Battery Storage</option>
                    <option value="Stationary Battery Storage">Stationary Battery Storage</option>
                    <option value="Solar Plant">Solar Plant</option>
                    <option value="Wind Turbine">Wind Turbine</option>
                </select>
            </div>

            {assetType && (
                <div className="form-group">
                    <label htmlFor="brand">Brand Name</label>
                    <input
                        id="brand"
                        type="text"
                        value={brand}
                        onChange={(e) => setBrand(e.target.value)}
                        className="form-control"
                        placeholder="Name"
                    />
                </div>
            )}

            {assetType && (
                <div className="form-group">
                    <label htmlFor="model">Model Name</label>
                    <input
                        id="model"
                        type="text"
                        value={model}
                        onChange={(e) => setModel(e.target.value)}
                        className="form-control"
                        placeholder="Name"
                    />
                </div>
            )}

            {assetType && (
                <div className="form-group">
                    <label htmlFor="model">Serial Number</label>
                    <input
                        id="serialNumber"
                        type="text"
                        value={serialNumber}
                        onChange={(e) => setSerialNumber(e.target.value)}
                        className="form-control"
                        placeholder="Enter"
                    />
                </div>
            )}

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

            {assetType && (
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

            {assetType && (
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
        </div>
    );
};

export default StepOneForm;
