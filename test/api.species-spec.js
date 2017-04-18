var supertest = require('supertest');
var _ = require('lodash');
var chai = require('chai');

var TestHelper = require('./helper');

var expect = chai.expect;
var request;

describe("/species", function(){
    var tHelper = new TestHelper();
    var speciesDbImages = tHelper.getTestDbImages();

    before(function(){
        return tHelper.beforeAPI()
            .then(function(testComponents){
                request = supertest(testComponents.server);
                return Promise.resolve();
            })
    });

    after(function(){
        return tHelper.afterAPI()
    });

    it("returns an array of available species", function () {

        return request.get(tHelper.buildEndpoint('species'))
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(function (res) {
                expect(_.isArray(res.body)).to.eql(true, 'response is an array');
                expect(res.body.length).to.eql(speciesDbImages.length, 'response is an array');
            })
            .expect(200)
    });
});