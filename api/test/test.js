const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../server.js');
const port = 3002; // Use an available port
const should = chai.should();

chai.use(chaiHttp);

describe('API Tests', function() {

    // Before running the tests, set the port for the server.
    before(function (done) {
        server.listen(port, done);
    });

    // After running the tests, close the server.
    after(function (done) {
        server.close(done);
    });

    // Company Registration
    it('should register a new company', function(done) {
        chai.request(server)
            .post('/company/register')
            .send({
                name: 'Test Company',
                email: 'testcompany@example.com',
                password: 'testpassword'
            })
            .end(function(err, res) {
                res.should.have.status(200);
                res.body.should.have.property('token');
                done();
            });
    });

    // Company Login
    it('should login a company', function(done) {
        chai.request(server)
            .post('/company/login')
            .send({
                email: 'testcompany@example.com',
                password: 'testpassword'
            })
            .end(function(err, res) {
                res.should.have.status(200);
                res.body.should.have.property('token');
                done();
            });
    });

    // Investor Registration
    it('should register a new investor', function(done) {
        chai.request(server)
            .post('/investor/register')
            .send({
                name: 'Test Investor',
                email: 'testinvestor@example.com',
                password: 'testpassword'
            })
            .end(function(err, res) {
                res.should.have.status(200);
                res.body.should.have.property('token');
                done();
            });
    });

    // Investor Login
    it('should login an investor', function(done) {
        chai.request(server)
            .post('/investor/login')
            .send({
                email: 'testinvestor@example.com',
                password: 'testpassword'
            })
            .end(function(err, res) {
                res.should.have.status(200);
                res.body.should.have.property('token');
                done();
            });
    });

});
