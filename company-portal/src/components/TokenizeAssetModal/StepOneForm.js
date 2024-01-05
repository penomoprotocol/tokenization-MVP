import React from 'react';

const StepOneForm = ({
    assetType, setAssetType,
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
