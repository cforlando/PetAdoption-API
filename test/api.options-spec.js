var url = require('url'),
    util = require('util'),
    fs = require('fs'),

    request = require('supertest'),
    async = require('async'),
    _ = require('lodash'),
    expect = require('expect.js'),


    TestHelper = require('./helper'),

    tHelper = new TestHelper(),

    // Functions
    sprintf = tHelper.sprintf,
    buildEndpoint = tHelper.buildEndpoint,
    buildJasmineRequestCallback = tHelper.buildJasmineRequestCallback;

describe("/options", function () {
    var speciesDBImages = tHelper.getTestDBImages(),
        server;

    before(function (done) {
        this.timeout(20 * 1000);
        tHelper.buildGlobalServer()
            .then(function (testServer) {
                server = testServer;
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
        var speciesName = dbImage.getSpeciesName(),
            optionsData = _.reduce(dbImage.getSpeciesProps(), function (collection, propData) {
                collection[propData.key] = propData.options || [];
                return collection;
            }, {});

        it(sprintf("returns a JSON array of all options for %s species", speciesName), function (done) {

            request(server)
                .get(buildEndpoint('options', speciesName))
                .set('Accept', 'application/json')
                .expect('Content-Type', /json/)
                .expect(function (res) {

                    _.forEach(optionsData, function (singleOptionList, singleOptionName) {

                        singleOptionList.forEach(function (option) {

                            expect(res.body[singleOptionName]).to.contain(option);
                        })
                    })
                })
                .expect(200, buildJasmineRequestCallback(done))
        });

        describe("/:optionName", function () {

            _.forEach(optionsData, function (optionList, optionName) {

                it(sprintf("returns JSON array of options for %s", optionName), function (done) {

                    request(server)
                        .get(buildEndpoint('options', speciesName, optionName))
                        .set('Accept', 'application/json')
                        .expect('Content-Type', /json/)
                        .expect(function (res) {
                            optionList.forEach(function (option) {
                                expect(res.body).to.contain(option);
                            })
                        })
                        .expect(200, buildJasmineRequestCallback(done))
                });
            })
        });
    });
});
