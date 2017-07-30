var url = require('url');
var util = require('util');
var fs = require('fs');

var supertest = require('supertest');
var async = require('async');
var _ = require('lodash');
var chai = require('chai');

var TestHelper = require('./helper');

var tHelper = new TestHelper();
var expect = chai.expect;
var dump = tHelper.dump;
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
        return tHelper.afterAPI()
    });

    describe("/v1", function () {

        it(sprintf("returns metaData for %s property values", speciesName), function () {

            return request.get(tHelper.buildEndpoint('species', speciesName, 'animals', 'list', {base: '/api/v1/'}))
                .set('Accept', 'application/json')
                .expect('Content-Type', /json/)
                .expect(200)
                .expect(function (res) {
                    expect(res.body).to.have.length.above(0);

                    _.forEach(res.body, function (animal) {

                        _.forEach(animal, function (animalPropData, propName) {

                            expect(animalPropData).to.be.an('object');
                            expect(animalPropData).to.contain.all.keys(['val', 'example', 'defaultVal', 'valType', 'key', 'options']);
                            if (propName !== 'images'){
                                expect(animalPropData).to.contain.all.keys('fieldLabel')
                            }
                        });
                    })
                })
        })
    });

});
