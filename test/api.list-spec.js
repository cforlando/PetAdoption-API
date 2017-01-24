var url = require('url'),
    util = require('util'),
    fs = require('fs'),

    request = require('supertest'),
    async = require('async'),
    _ = require('lodash'),
    expect = require('expect.js'),


    TestHelper = require('./helper'),

    tHelper = new TestHelper(),

    sprintf = tHelper.sprintf,
    buildEndpoint = tHelper.buildEndpoint,
    buildJasmineRequestCallback = tHelper.buildJasmineRequestCallback;


describe("/list", function () {
    var speciesDBImages = tHelper.getTestDBImages(),
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

    speciesDBImages.forEach(function (dbImage) {
        var speciesName = dbImage.getSpeciesName();


        it(sprintf("returns JSON of all %s species", speciesName), function (done) {
            request(server)
                .get(buildEndpoint('list', speciesName))
                .set('Accept', 'application/json')
                .expect('Content-Type', /json/)
                .expect(function (res) {
                    if (!_.isArray(res.body)) throw new Error(special("/list/%s did not return array", speciesName));
                    if (res.body.length) {
                        _.forEach(res.body, function (petData, index) {
                            if (petData['species'].val != speciesName) {
                                throw new Error(sprintf("list/%s return a pet with incorrect species at index %s", speciesName, index))
                            }
                        })
                    } else {
                        throw new Error("/list/" + speciesName + " did not return any results")
                    }
                })
                .expect(200, buildJasmineRequestCallback(done))
        });

        it(sprintf("returns a paged JSON of all %s species", speciesName), function (done) {
            var pageSize = 3;

            request(server)
                .get(buildEndpoint('list', speciesName))
                .set('Accept', 'application/json')
                .expect('Content-Type', /json/)
                .end(function (err, fullListResponse) {
                    request(server)
                        .get(buildEndpoint('list', speciesName, 1, {pageSize: pageSize}))
                        .set('Accept', 'application/json')
                        .expect('Content-Type', /json/)
                        .expect(function (paramedListResponse) {
                            if (!_.isArray(paramedListResponse.body)) throw new Error(sprintf("list/%s did not return array", speciesName));
                            if (fullListResponse.body.length > pageSize && paramedListResponse.body.length != pageSize) throw new Error(sprintf("list/%s return %s instead of %s pets", speciesName, paramedListResponse.body.length, pageSize));
                            if (paramedListResponse.body.length) {
                                _.forEach(paramedListResponse.body, function (petData, index) {
                                    if (petData['species'].val != speciesName) throw new Error(sprintf("list/%s return a pet with incorrect species at index %s", speciesName, index))
                                })
                            } else {
                                throw new Error("/list/" + speciesName + " did not return any results")
                            }
                        })
                        .expect(200, buildJasmineRequestCallback(done))
                })
        });

        it("returns only request parameters when 'properties' key provided", function (done) {
            var properties = ['species', 'petName'];
            request(server)
                .get(buildEndpoint('list', speciesName, {properties: properties}))
                .set('Accept', 'application/json')
                .expect('Content-Type', /json/)
                .expect(function (res) {
                    if (!_.isArray(res.body)) throw new Error(sprintf("list/%s did not return array", speciesName));
                    if (res.body.length) {
                        var expectedNumOfProperties = properties.length;
                        _.forEach(res.body, function (petData, index) {
                            if (petData['species'].val != speciesName) throw new Error(sprintf("list/%s return a pet with incorrect species at index %s", speciesName, index));
                            var numOfProperties = Object.keys(petData).length;
                            if (numOfProperties != expectedNumOfProperties) throw new Error(sprintf("Received incorrect number of properties %s != %s", numOfProperties, expectedNumOfProperties))
                        })
                    } else {
                        throw new Error("/list/" + speciesName + " did not return any results");
                    }
                })
                .expect(200, buildJasmineRequestCallback(done))
        })
    });
});

