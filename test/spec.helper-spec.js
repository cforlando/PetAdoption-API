var _ = require('lodash');
var chai = require('chai');

var Helper = require('./helper');

var expect = chai.expect;
var tHelper = new Helper();
var speciesDbImages = tHelper.testDbImages;

describe("Helper (for tests)", function () {
    var tHelper = new Helper();

    describe("buildEndpoint()", function () {

        it("returns correct values", function () {
            var pagedParamedRequest = tHelper.buildEndpoint('list', 'dog', 2, {
                pageSize: 5
            });
            var propertiesParamedRequest = tHelper.buildEndpoint('list', 'dog', {
                properties: ['species', 'propName']
            });
            expect(tHelper.buildEndpoint('save', 'cat')).to.match(/^\/api\/v1\/save\/cat\/?$/);
            expect(tHelper.buildEndpoint('remove', 'cat')).to.match(/^\/api\/v1\/remove\/cat\/?$/);
            expect(tHelper.buildEndpoint('model', 'dog')).to.match(/^\/api\/v1\/model\/dog\/?$/);
            expect(tHelper.buildEndpoint('options', 'dog')).to.match(/\/api\/v1\/options\/dog\/?$/);
            expect(tHelper.buildEndpoint('query')).to.match(/^\/api\/v1\/query\/?$/);
            expect(tHelper.buildEndpoint('species')).to.match(/^\/api\/v1\/species\/?$/);
            expect(tHelper.buildEndpoint('list', 'dog')).to.match(/^\/api\/v1\/list\/dog\/?$/);
            expect(tHelper.buildEndpoint('list', 'dog', {pageSize: 5})).to.match(/^\/api\/v1\/list\/dog\?pageSize=5$/);
            expect(pagedParamedRequest).to.match(/^\/api\/v1\/list\/dog\/2\?pageSize=5$/);
            expect(propertiesParamedRequest).to.eql(tHelper.sprintf('/api/v1/list/dog?properties=%s', encodeURIComponent("['species','propName']")));
        })
    });

    describe("speciesDbImages", function () {

        it("are initialized correctly", function () {

            expect(speciesDbImages).to.be.an('Array');

            _.forEach(speciesDbImages, function (dbImage) {

                expect(dbImage.speciesName).to.be.a('String');
                expect(dbImage.speciesProps).to.exist;
                expect(dbImage.animals).to.be.an('Array');
            });

        });
    });
});
