var request = require('supertest'),
    _ = require('lodash'),
    expect = require('expect.js'),

    TestHelper = require('./helper'),

    tHelper = new TestHelper(),

    speciesDBImages = tHelper.getTestDBImages(),
    buildEndpoint = tHelper.buildEndpoint,
    buildJasmineRequestCallback = tHelper.buildJasmineRequestCallback,
    server;

describe("/species", function(){

    before(function(done){
        tHelper.beforeAPI()
            .then(function(testComponents){
                server = testComponents.server;
            })
            .then(done)
            .catch(done)
    });

    after(function(done){
        tHelper.afterAPI()
            .then(done)
            .catch(done)
    });

    it("returns an array of available species", function (done) {

        request(server)
            .get(buildEndpoint('species'))
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(function (res) {
                expect(_.isArray(res.body)).to.be(true, 'response is an array');
                expect(res.body.length).to.equal(speciesDBImages.length, 'response is an array');
            })
            .expect(200, buildJasmineRequestCallback(done))
    });
});