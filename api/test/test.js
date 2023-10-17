const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('../server.js');
const should = chai.should();
chai.use(chaiHttp);

// Import Mongoose and the Company model
const mongoose = require('mongoose');
const Company = require('../../database/models/Company.js');

describe('API Tests', function () {
    before(function (done) {
        // Establish a connection to the test database (if you're using a testing database)
        // Replace 'your_test_database_uri' with your actual test database URI
        mongoose.connect('mongodb://localhost:27017/test', {
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
            }
        });
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
        });
    });

    it('should register a new company', function (done) {
        chai.request(app)
            .post('/company/register')
            .send({
                name: 'Test Company',
                email: 'testcompany@example.com',
                password: 'testpassword',
            })
            .end(function (err, res) {
                if (err) {
                    console.error('Error registering a company:', err);
                    done(err);
                } else {
                    res.should.have.status(200);
                    res.body.should.have.property('token');
                    done();
                }
            });
    });

    it('should login a company', function (done) {
        chai.request(app)
            .post('/company/login')
            .send({
                email: 'testcompany@example.com',
                password: 'testpassword',
            })
            .end(function (err, res) {
                if (err) {
                    console.error('Error logging in a company:', err);
                    done(err);
                } else {
                    res.should.have.status(200);
                    res.body.should.have.property('token');
                    done();
                }
            });
    });

    it('should register a new investor', function (done) {
        chai.request(app)
            .post('/investor/register')
            .send({
                name: 'Test Investor',
                email: 'testinvestor@example.com',
                password: 'testpassword',
            })
            .end(function (err, res) {
                if (err) {
                    console.error('Error registering an investor:', err);
                    done(err);
                } else {
                    res.should.have.status(200);
                    res.body.should.have.property('token');
                    done();
                }
            });
    });

    it('should login an investor', function (done) {
        chai.request(app)
            .post('/investor/login')
            .send({
                email: 'testinvestor@example.com',
                password: 'testpassword',
            })
            .end(function (err, res) {
                if (err) {
                    console.error('Error logging in an investor:', err);
                    done(err);
                } else {
                    res.should.have.status(200);
                    res.body.should.have.property('token');
                    done();
                }
            });
    });
});
