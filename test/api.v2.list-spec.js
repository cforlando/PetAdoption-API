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

    describe("/v2", function () {
        it(sprintf("returns values without meta data for %s properties", speciesName), function (done) {
            request(server)
                .get(buildEndpoint('list', speciesName, {base: '/api/v2/'}))
                .set('Accept', 'application/json')
                .expect('Content-Type', /json/)
                .expect(function (res) {
                    expect(res.body.length).to.be.greaterThan(0);
                    _.forEach(res.body, function (animalProps) {
                        _.forEach(animalProps, function (propData, propName) {
                            if (_.isPlainObject(propData))  throw new Error(sprintf("a %s returned an object for %s", speciesName, propName))
                        });
                    })
                })
                .expect(200, buildJasmineRequestCallback(done))
        })
    });


});
