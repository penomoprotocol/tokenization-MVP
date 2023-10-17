const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('../server.js');
const should = chai.should();
const mongoose = require('mongoose');
require('dotenv').config();

// Get variables from .env
const PORT = process.env.PORT || 3000;
const SECRET_KEY = process.env.SECRET_KEY;
const MONGO_URI = process.env.MONGO_URI;

chai.use(chaiHttp);

before(function (done) {
    // Establish a connection to the test database 
    mongoose.connect(MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    }, function (err) {
        if (err) {
            console.error('Failed to connect to the test database:', err);
            done(err);
        } else {
            // Clear the Company collection in the test database
            Company.deleteMany({}, function (err) {
                if (err) {
                    console.error('Failed to clear the Company collection:', err);
                    done(err);
                } else {
                    done();
                }
            });
            Investor.deleteMany({}, function (err) {
                if (err) {
                    console.error('Failed to clear the Investor collection:', err);
                    done(err);
                } else {
                    done();
                }
            });
        }
    }).catch(done());
});

after(function (done) {
    // Close the Mongoose connection after all tests
    mongoose.connection.close(function (err) {
        if (err) {
            console.error('Failed to close the Mongoose connection:', err);
            done(err);
        } else {
            done();
        }
    }).catch(done());
});

describe('Company API', function () {
    let companyId; // Define companyId in the outer scope

    it('should register a new company', (done) => {
        chai.request(app)
            .post('/company/register')
            .send({
                name: 'Test Company',
                email: 'testcompany@example.com',
                password: 'testpassword',
            })
            .then(function (res) {
                res.should.have.status(200);
                res.body.should.be.a('object');
                companyId = res.body.company._id; // Extract the ID of the registered company
                console.log("companyId: ", companyId);
                done();
            })
            .catch(function (err) {
                // Handle errors and signal test completion in case of failure
                done(err);
            });
    });

    // Log in with the registered company
    it('should log in with the registered company', (done) => {
        chai.request(app)
            .post('/company/login')
            .send({
                email: 'testcompany@example.com',
                password: 'testpassword',
            })
            .then(function (res) {
                res.should.have.status(200);
                res.body.should.be.a('object');
                res.body.should.have.property('token');
                //console.log(res.body);
                done();
            })
            .catch(function (err) {
                // Handle errors and signal test completion in case of failure
                done(err);
            });
    });

    it('should get company details', (done) => {
        chai.request(app)
            .get(`/company/${companyId}`)
            .send({
                _id: companyId,
            })
            .then(function (res) {
                res.should.have.status(200);
                res.body.should.be.a('object');
                console.log(res.body);
                done();
            })
            .catch(function (err) {
                // Handle errors and signal test completion in case of failure
                done(err);
            });
    });

    it('should update company details', (done) => {
        chai.request(app)
            .put(`/company/${companyId}`)
            .send({
                _id: companyId,
                name: 'Updated Company Name',
            })
            .then(function (res) {
                res.should.have.status(200);
                res.body.should.be.a('object');
                res.body.should.have.property('name', 'Updated Company Name');
                done(); // Signal that the test is complete on success
            })
            .catch(function (err) {
                // Handle errors and signal test completion in case of failure
                done(err);
            });
    });


    it('should delete the company', (done) => {
        chai.request(app)
            .delete(`/company/${companyId}`)
            .send({
                _id: companyId,
            })
            .then(function (res) {
                res.should.have.status(200);
                done();
            })
            .catch(function (err) {
                // Handle errors and signal test completion in case of failure
                done(err);
            });
    });
});


describe('Investor API', function () {
    let investorId; // Define investorId in the outer scope

    it('should register a new investor', (done) => {
        chai.request(app)
            .post('/investor/register')
            .send({
                name: 'Test Investor',
                email: 'testinvestor@example.com',
                password: 'testpassword',
            })
            .then(function (res) {
                res.should.have.status(200);
                res.body.should.be.a('object');
                console.log(res.body);
                investorId = res.body.investor._id; // Extract the ID of the registered investor
                console.log("investorId: ", investorId);
                done();
            })
            .catch(function (err) {
                // Handle errors and signal test completion in case of failure
                done(err);
            });
    });

    // Log in with the registered investor
    it('should log in with the registered investor', (done) => {
        chai.request(app)
            .post('/investor/login')
            .send({
                email: 'testinvestor@example.com',
                password: 'testpassword',
            })
            .then(function (res) {
                res.should.have.status(200);
                res.body.should.be.a('object');
                res.body.should.have.property('token');
                //console.log(res.body);
                done();
            })
            .catch(function (err) {
                // Handle errors and signal test completion in case of failure
                done(err);
            });
    });

    it('should get investor details', (done) => {
        chai.request(app)
            .get(`/investor/${investorId}`)
            .send({
                _id: investorId,
            })
            .then(function (res) {
                res.should.have.status(200);
                res.body.should.be.a('object');
                console.log(res.body);
                done();
            })
            .catch(function (err) {
                // Handle errors and signal test completion in case of failure
                done(err);
            });
    });

    it('should update investor details', (done) => {
        chai.request(app)
            .put(`/investor/${investorId}`)
            .send({
                _id: investorId,
                name: 'Updated Investor Name',
            })
            .then(function (res) {
                res.should.have.status(200);
                res.body.should.be.a('object');
                res.body.should.have.property('name', 'Updated Investor Name');
                done(); // Signal that the test is complete on success
            })
            .catch(function (err) {
                // Handle errors and signal test completion in case of failure
                done(err);
            });
    });

    it('should delete the investor', (done) => {
        chai.request(app)
            .delete(`/investor/${investorId}`)
            .send({
                _id: investorId,
            })
            .then(function (res) {
                res.should.have.status(200);
                done();
            })
            .catch(function (err) {
                // Handle errors and signal test completion in case of failure
                done(err);
            });
    });
});

