var url = require('url');
var util = require('util');
var fs = require('fs');

var supertest = require('supertest');
var async = require('async');
var _ = require('lodash');
var chai = require('chai');

var TestHelper = require('./helper');

var tHelper = new TestHelper();
var sprintf = tHelper.sprintf;
var expect = chai.expect;

describe("/options", function () {
    var speciesDbImages = tHelper.getTestDbImages();
    var request;

    before(function () {
        this.timeout(20 * 1000);

        return tHelper.buildGlobalServer()
            .then(function (testServer) {
                request = supertest(testServer);
                return Promise.resolve();
            })
    });

    after(function () {
        return tHelper.afterAPI()
    });

    speciesDbImages.forEach(function (dbImage) {
        var speciesName = dbImage.getSpeciesName(),
            optionsData = _.reduce(dbImage.getSpeciesProps(), function (collection, propData) {
                collection[propData.key] = propData.options || [];
                return collection;
            }, {});

        it(sprintf("returns a JSON array of all options for %s species", speciesName), function () {

            return request.get(tHelper.buildEndpoint('options', speciesName))
                .set('Accept', 'application/json')
                .expect('Content-Type', /json/)
                .expect(function (res) {

                    _.forEach(optionsData, function (singleOptionList, singleOptionName) {

                        singleOptionList.forEach(function (option) {

                            expect(res.body[singleOptionName]).to.contain(option);
                        })
                    })
                })
                .expect(200)
        });

        describe("/:optionName", function () {

            _.forEach(optionsData, function (optionList, optionName) {

                it(sprintf("returns JSON array of options for %s", optionName), function () {

                    request.get(tHelper.buildEndpoint('options', speciesName, optionName))
                        .set('Accept', 'application/json')
                        .expect('Content-Type', /json/)
                        .expect(function (res) {
                            optionList.forEach(function (option) {
                                expect(res.body).to.contain(option);
                            })
                        })
                        .expect(200)
                });
            })
        });
    });
});
