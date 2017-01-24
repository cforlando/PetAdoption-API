var url = require('url'),
    util = require('util'),
    path = require('path'),
    fs = require('fs'),

    request = require('supertest'),
    async = require('async'),
    _ = require('lodash'),
    expect = require('expect.js'),


    TestHelper = require('./helper'),

    tHelper = new TestHelper();

describe("/api", function () {

    var dump = tHelper.dump,
        sprintf = tHelper.sprintf,
        buildEndpoint = tHelper.buildEndpoint,
        buildJasmineRequestCallback = tHelper.buildJasmineRequestCallback,

        dbImage = tHelper.getTestDBImages()[0],
        speciesName = dbImage.getSpeciesName(),
        server;

    before(function (done) {
        this.timeout(20 * 1000);
        tHelper.beforeAPI()
            .then(function (testComponents) {
                server = testComponents.server;
                done();
            })
            .catch(done)
    });

    after(function (done) {
        tHelper.afterAPI()
            .then(done)
            .catch(done)
    });

    describe("/v1", function () {
        it(sprintf("returns metaData for %s property values", speciesName), function (done) {
            request(server)
                .get(buildEndpoint('list', speciesName, {base: '/api/v1/'}))
                .set('Accept', 'application/json')
                .expect('Content-Type', /json/)
                .expect(function (res) {
                    expect(res.body.length).to.be.greaterThan(0);
                    _.forEach(res.body, function (animal) {
                        _.forEach(animal, function (animalPropData, propName) {
                            if (!_.isPlainObject(animalPropData)) {
                                throw new Error(sprintf("a %s did not return an object for %s", speciesName, propName));
                            }
                            expect(animalPropData.val).not.to.be(undefined, sprintf('%s.val not defined', dump(animal)));
                            expect(animalPropData.example).not
                                .to.be(undefined, sprintf('%s.example not defined', dump(animal)));
                            expect(animalPropData.defaultVal).not.to.be(undefined);
                            expect(animalPropData.valType).not.to.be(undefined);
                            expect(animalPropData.key).not.to.be(undefined);
                            expect(animalPropData.options).not.to.be(undefined);
                            if (propName != 'images') expect(animalPropData.fieldLabel).not.to.be(undefined);
                        });
                    })
                })
                .expect(200, buildJasmineRequestCallback(done))
        })
    });

});
