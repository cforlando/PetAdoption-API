var _ = require('lodash'),
    expect = require('expect.js'),

    Helper = require('./helper'),
    tHelper = new Helper(),
    speciesDBImages = tHelper.testDBImages;

describe("tHelper", function () {
    var tHelper = new Helper();

    describe("buildEndpoint()", function () {

        it("returns correct values", function () {
            expect(tHelper.buildEndpoint('save', 'cat')).to.match(/^\/api\/v1\/save\/cat\/?$/);
            expect(tHelper.buildEndpoint('remove', 'cat')).to.match(/^\/api\/v1\/remove\/cat\/?$/);
            expect(tHelper.buildEndpoint('model', 'dog')).to.match(/^\/api\/v1\/model\/dog\/?$/);
            expect(tHelper.buildEndpoint('options', 'dog')).to.match(/\/api\/v1\/options\/dog\/?$/);
            expect(tHelper.buildEndpoint('query')).to.match(/^\/api\/v1\/query\/?$/);
            expect(tHelper.buildEndpoint('species')).to.match(/^\/api\/v1\/species\/?$/);
            expect(tHelper.buildEndpoint('list', 'dog')).to.match(/^\/api\/v1\/list\/dog\/?$/);
            expect(tHelper.buildEndpoint('list', 'dog', {pageSize: 5})).to.match(/^\/api\/v1\/list\/dog\?pageSize=5$/);
            expect(tHelper.buildEndpoint('list', 'dog', 2, {
                pageSize: 5
            })).to.match(/^\/api\/v1\/list\/dog\/2\?pageSize=5$/);
            expect(tHelper.buildEndpoint('list', 'dog', {
                properties: ['species', 'propName']
            }))
                .to.equal(tHelper.sprintf('/api/v1/list/dog?properties=%s', encodeURIComponent("['species','propName']")));
        })
    });

    describe("speciesDBImages", function () {

        it("are initialized correctly", function () {

            expect(_.isArray(speciesDBImages)).to.be(true);

            _.forEach(speciesDBImages, function (dbImage) {

                expect(_.isString(dbImage.speciesName)).to.be(true);

                expect(dbImage.speciesProps).not.to.be(undefined);

                expect(_.isArray(dbImage.animals)).to.be(true);

            });

        });
    });
});
