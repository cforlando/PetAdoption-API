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
var request;


describe("/species/all/animals/list", function () {
    var speciesDbImages = tHelper.getTestDbImages();

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

    speciesDbImages.forEach(function (dbImage) {
        var speciesName = dbImage.getSpeciesName();

        it(sprintf("returns JSON of all %s species", speciesName), function () {
            return request.get(tHelper.buildEndpoint('species', speciesName, 'animals', 'list'))
                .set('Accept', 'application/json')
                .expect('Content-Type', /json/)
                .expect(200)
                .expect(function (res) {
                    expect(res.body).to.be.an('Array');
                    expect(res.body).to.have.length.above(0);
                    _.forEach(res.body, function (petData, index) {
                        expect(petData.species.val).to.eql(speciesName)
                    });
                })
        });

        it(sprintf("returns a paged JSON of all %s species", speciesName), function () {
            var pageSize;

            return request.get(tHelper.buildEndpoint('species', speciesName, 'animals', 'list'))
                .set('Accept', 'application/json')
                .expect('Content-Type', /json/)
                .expect(200)
                .then(function (fullListResponse) {
                    // ensure test has animals to test against
                    expect(fullListResponse.body).to.have.length.above(0);

                    // use half of entire size as page size limit
                    pageSize = parseInt(fullListResponse.body.length / 2);

                    return request.get(tHelper.buildEndpoint('species', speciesName, 'animals', 'list', 1, {pageSize: pageSize}))
                        .set('Accept', 'application/json')
                        .expect('Content-Type', /json/)
                        .expect(200)
                        .expect(function (paramedListResponse) {

                            expect(paramedListResponse.body).to.be.an('Array');
                            expect(paramedListResponse.body).to.have.length.of.at.most(pageSize);
                            expect(paramedListResponse.body).to.have.length.above(0);
                            _.forEach(paramedListResponse.body, function (petData, index) {
                                expect(petData['species'].val).to.eql(speciesName);
                            })

                        })
                })
        });

        it("returns only request parameters when 'properties' key provided", function () {
            var properties = ['species', 'petName'];

            return request.get(tHelper.buildEndpoint('species', speciesName, 'animals', 'list', {properties: properties}))
                .set('Accept', 'application/json')
                .expect('Content-Type', /json/)
                .expect(200)
                .expect(function (res) {
                    expect(res.body).to.be.an('Array');
                    expect(res.body).to.have.length.above(0);

                    _.forEach(res.body, function (petData, index) {
                        expect(petData.species.val).to.eql(speciesName);
                        expect(petData).to.include.all.keys(properties);
                        expect(Object.keys(petData)).to.have.lengthOf(properties.length);
                    })
                })
        })
    });
});

