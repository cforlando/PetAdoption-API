var request = require('supertest'),
    expect = require('expect.js'),

    TestHelper = require('./helper'),

    tHelper = new TestHelper(),
    buildEndpoint = tHelper.buildEndpoint,
    buildJasmineRequestCallback = tHelper.buildJasmineRequestCallback,
    server;

describe("/user", function () {

    before(function(done){
        tHelper.buildGlobalServer()
            .then(function(testServer){
                server = testServer;
                done();
            })
    });

    after(function(done){
        tHelper.afterAPI()
            .then(done)
            .catch(done)
    });

    it("returns 401 when unauthorized user request made", function (done) {
        request(server)
            .get(buildEndpoint('user'))
            .set('Accept', 'application/json')
            .expect(401, buildJasmineRequestCallback(done))
    });
});
