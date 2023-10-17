const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('../server.js'); // Make sure to provide the correct path to your server.js file
const should = chai.should();

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
            .catch(done); // Handle promise rejections by calling done()
    });
    
});

