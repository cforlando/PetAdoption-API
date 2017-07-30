var url = require('url');
var util = require('util');
var path = require('path');
var fs = require('fs');

var supertest = require('supertest');
var async = require('async');
var _ = require('lodash');
var chai = require('chai');

var TestHelper = require('./helper');

var expect = chai.expect;
var tHelper = new TestHelper();
var sprintf = tHelper.sprintf;
var request;

describe("/api", function () {
    var dbImage = tHelper.getTestDbImages()[0];
    var speciesName = dbImage.getSpeciesName();

    before(function () {
        this.timeout(20 * 1000);

        return tHelper.beforeAPI()
            .then(function (testComponents) {
                request = supertest(testComponents.server);
                return Promise.resolve();
            })
    });

    after(function () {
        return tHelper.afterAPI();
    });

    describe("/v2", function () {

        it(sprintf("returns values without meta data for %s properties", speciesName), function () {

            return request.get(tHelper.buildEndpoint('species', speciesName, 'animals', 'list', {base: '/api/v2/'}))
                .set('Accept', 'application/json')
                .expect('Content-Type', /json/)
                .expect(200)
                .expect(function (res) {

                    expect(res.body).to.have.length.above(0);

                    _.forEach(res.body, function (animalProps) {

                        _.forEach(animalProps, function (propValue, propName) {
                            expect(propValue).to.not.be.undefined;
                            if (propValue !== null){
                                expect(propValue.key).to.be.undefined;
                            }
                        });
                    })
                })
        })
    });


});
