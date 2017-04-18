var supertest = require('supertest');
var chai = require('chai');

var TestHelper = require('./helper');

var tHelper = new TestHelper();
var expect = chai.expect;
var request;

describe("/user", function () {

    before(function () {
        return tHelper.buildGlobalServer()
            .then(function (testServer) {
                request = supertest(testServer);
                return Promise.resolve();
            })
    });

    after(function () {
        return tHelper.afterAPI()
    });

    it("returns 401 when unauthorized user request made", function () {
        return request.get(tHelper.buildEndpoint('user'))
            .set('Accept', 'application/json')
            .expect(401)
    });
});
