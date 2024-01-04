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

    return (
        <div>
            <h3>Asset Details</h3>
            {/* Asset Type Dropdown */}
            <select value={assetType} onChange={(e) => setAssetType(e.target.value)}>
                <option value="">Select Asset Type</option>
                <option value="battery">Battery</option>
                <option value="solar">Solar</option>
                <option value="windTurbine">Wind Turbine</option>
            </select>

            {/* Other Input Fields */}
            <input type="text" value={capacity} onChange={(e) => setCapacity(e.target.value)} placeholder="Capacity (kWh)" />
            <input type="text" value={power} onChange={(e) => setPower(e.target.value)} placeholder="Power (kW)" />
            <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Location (Country)" />
            <input type="text" value={assetValue} onChange={(e) => setAssetValue(e.target.value)} placeholder="Asset Value" />

            {/* Revenue Streams */}
            {revenueStreams.map((stream, index) => (
                <div key={index}>
                    <input
                        type="text"
                        value={stream.name}
                        onChange={(e) => handleRevenueStreamChange(index, 'name', e.target.value)}
                        placeholder="Revenue Stream Name"
                    />
                    <input
                        type="text"
                        value={stream.amount}
                        onChange={(e) => handleRevenueStreamChange(index, 'amount', e.target.value)}
                        placeholder="Amount"
                    />
                    <input
                        type="text"
                        value={stream.details}
                        onChange={(e) => handleRevenueStreamChange(index, 'details', e.target.value)}
                        placeholder="Details"
                    />
                </div>
            ))}
            <button onClick={addRevenueStream}>Add Revenue Stream</button>
        </div>
    );
};

export default StepOneForm;
