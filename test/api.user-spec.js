var supertest = require('supertest');
var chai = require('chai');

var config = require('../core/config');
var TestHelper = require('./helper');

var tHelper = new TestHelper();
var expect = chai.expect;
var processEnvDevelopmentFlag = process.env.DEVELOPMENT_ENV;
var request;

describe("/user", function () {

    before(function () {
        config.DEVELOPMENT_ENV = undefined;
        return tHelper.buildGlobalServer()
            .then(function (testServer) {
                request = supertest(testServer);
                return Promise.resolve();
            })
    });

    after(function () {
        config.DEVELOPMENT_ENV = processEnvDevelopmentFlag;
        return tHelper.afterAPI()
    });

    it("returns 401 when unauthorized user request made", function () {
        return request.get(tHelper.buildEndpoint('user'))
            .set('Accept', 'application/json')
            .expect(401)
    });
});
