const mongoose = require('mongoose');

const companySchema = new mongoose.Schema(
    {
      name: {
        type: String,
        required: true
      },
      email: {
        type: String,
        required: true,
        unique: true
      },
      password: {
        type: String,
        required: true
      },
    },
    {
      collection: 'companies' 
    }
  );
  
  const Company = mongoose.model('Company', companySchema);
  
  module.exports = Company;
  