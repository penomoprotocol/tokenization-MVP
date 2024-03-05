

require('dotenv').config();
const KYC_API_KEY = process.env.KYC_API_KEY;

const verifyApiKey = (req, res, next) => {
    const apiKey = req.get('X-API-Key'); // Assuming the API key is sent in the header named X-API-Key
    if (apiKey && apiKey === process.env.API_KEY) {
        next(); // API key is valid, proceed to the next middleware/route handler
    } else {
        res.status(401).json({ error: 'Unauthorized: Invalid API Key' }); // Unauthorized, invalid API key
    }
};

module.exports = verifyApiKey;