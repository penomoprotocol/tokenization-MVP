const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('../server.js'); // Make sure to provide the correct path to your server.js file
const should = chai.should();
const mongoose = require('mongoose');
require('dotenv').config();

// Get variables from .env
const PORT = process.env.PORT || 3000;
const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY;
const MONGO_URI = process.env.MONGO_URI;

chai.use(chaiHttp);

describe('Company Registration API', function () {
    it('should register a new company', (done) => {
        chai.request(app)
            .post('/company/register')
            .send({
                name: 'Test Company2',
                email: 'testcompany2@example.com',
                password: 'testpassword2',
            })
            .then(function (res) {
                res.should.have.status(200);
                res.body.should.be.a('object');
            })
            .catch(done()); // Handle promise rejections by calling done()
    });

});

