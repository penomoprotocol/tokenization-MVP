const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('../server.js');
const port = 3000; // Use an available port
const should = chai.should();
chai.use(chaiHttp);

describe('API Tests', function () {

    // // Before running the tests, start the Express app.
    // before(function (done) {
    //     app.listen(port, done);
    // });

    // // After running the tests, close the Express app.
    // after(function (done) {
    //     // Close any resources, but app.listen doesn't need to be closed.
    //     done();
    // });

    // Company Registration
    it('should register a new company', function (done) {
        chai.request(app)
            .post('/company/register')
            .send({
                name: 'Test Company',
                email: 'testcompany@example.com',
                password: 'testpassword'
            })
            .end(function (err, res) {
                res.should.have.status(200);
                res.body.should.have.property('token');
                done();
            });
    });

    // Company Login
    it('should login a company', function (done) {
        chai.request(app)
            .post('/company/login')
            .send({
                email: 'testcompany@example.com',
                password: 'testpassword'
            })
            .end(function (err, res) {
                res.should.have.status(200);
                res.body.should.have.property('token');
                done();
            });
    });

    // Investor Registration
    it('should register a new investor', function (done) {
        chai.request(app)
            .post('/investor/register')
            .send({
                name: 'Test Investor',
                email: 'testinvestor@example.com',
                password: 'testpassword'
            })
            .end(function (err, res) {
                res.should.have.status(200);
                res.body.should.have.property('token');
                done();
            });
    });

    // Investor Login
    it('should login an investor', function (done) {
        chai.request(app)
            .post('/investor/login')
            .send({
                email: 'testinvestor@example.com',
                password: 'testpassword'
            })
            .end(function (err, res) {
                res.should.have.status(200);
                res.body.should.have.property('token');
                done();
            });
    });

});
