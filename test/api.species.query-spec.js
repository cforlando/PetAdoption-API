var supertest = require('supertest');
var _ = require('lodash');
var chai = require('chai');

var Species = require('../core/lib/species');
var TestHelper = require('./helper');

var expect = chai.expect;
var tHelper = new TestHelper();
var speciesDbImages = tHelper.getTestDbImages();
var fmt = tHelper.sprintf;
var alterCase = tHelper.alterCase;
var getRandomOptionValue = tHelper.getRandomOptionValue;
var database;

describe("/species/all/query", function () {
    var request;

    before(function () {
        this.timeout(20 * 1000);

        return tHelper.beforeAPI()
            .then(function (testComponents) {
                request = supertest(testComponents.server);
                database = testComponents.database;
                return Promise.resolve();
            })
    });

    after(function () {
        return tHelper.afterAPI()
    });

    it("accepts query when species field not provided", function () {
        var queryProps = {
            color: "White"
        };

        return request.post(tHelper.buildEndpoint('species', 'all', 'query'))
            .set('Accept', 'application/json')
            .send(queryProps)
            .expect(200)
    });

    describe('for each species', function () {

        speciesDbImages.forEach(function (dbImage) {

            var testSpecies = new Species('testSpecies', dbImage.getSpeciesProps()),
                speciesName = dbImage.getSpeciesName(),
                speciesProps = dbImage.getSpeciesProps(),
                speciesTestProps = speciesProps.filter(function (propData) {
                    switch (propData.key) {
                        case 'petId':
                        case 'description':
                        case 'images':
                        case 'defaults':
                        case 'test':
                            return false;
                        default:
                            return true;

                    }
                });

            speciesTestProps.forEach(function (tSpeciesPropData, index) {

                var tSpeciesPropName = tSpeciesPropData.key,
                    queryProps = {species: speciesName};

                // TODO implement tests for location
                if (tSpeciesPropData.valType == 'location') {
                    // skip location fields
                    return;
                }


                queryProps[tSpeciesPropName] = getRandomOptionValue(tSpeciesPropData);

                it(fmt("returns JSON of all %s species with provided %s prop", speciesName, tSpeciesPropName), function () {

                    return database.saveAnimal(speciesName, queryProps)
                        .then(function () {
                            return request.post(tHelper.buildEndpoint('species', 'all', 'query'))
                                .send(queryProps)
                                .set('Accept', 'application/json')
                                .expect('Content-Type', /json/)
                                .expect(tHelper.buildAnimalTest(queryProps, speciesTestProps))
                                .expect(200)
                        });
                });

                it("returns only requested properties when 'properties' key is defined", function () {
                    var queryProperties = ['species', 'petId'];
                    var animalQuery = Object.assign({properties: queryProperties}, queryProps);

                    return database.saveAnimal(speciesName, Object.assign({petName: "test-pet-" + index}, queryProps))
                        .then(function (animalData) {
                            return request.post(tHelper.buildEndpoint('species', 'all', 'query'))
                                .set('Accept', 'application/json')
                                .expect('Content-Type', /json/)
                                .send(animalQuery)
                                .expect(tHelper.buildAnimalTest(_.pick(animalQuery, queryProperties), speciesTestProps))
                                .expect(function (res) {
                                    expect(res.body).to.be.an('array');
                                    expect(res.body).to.have.length.above(0);

                                    res.body.forEach(function (petData) {
                                        expect(petData).to.have.all.keys(queryProperties);
                                    });
                                })
                                .expect(200)
                        });
                });

            });

            describe("when multiple params are provided", function () {
                var queryProps = {species: speciesName};

                speciesTestProps.forEach(function (tSpeciesPropData) {
                    var testInstanceProps = {};

                    testInstanceProps[tSpeciesPropData.key] = getRandomOptionValue(tSpeciesPropData);
                    queryProps = Object.assign(testInstanceProps, queryProps);

                    it(fmt("returns JSON of all %s species with provided '%s' props", speciesName, Object.keys(queryProps).join(", ")), function () {

                        return database.saveAnimal(speciesName, queryProps)
                            .then(function () {

                                return request.post(tHelper.buildEndpoint('species', 'all', 'query'))
                                    .send(queryProps)
                                    .set('Accept', 'application/json')
                                    .expect('Content-Type', /json/)
                                    .expect(tHelper.buildAnimalTest(queryProps, speciesTestProps))
                                    .expect(200)
                            })
                    })
                })
            });

            describe("when ignoreCase flag is set", function () {

                speciesTestProps.forEach(function (tSpeciesPropData) {
                    var tSpeciesPropName = tSpeciesPropData.key;

                    //skip non-string values
                    if (tSpeciesPropData.valType.toLowerCase() !== 'string') {
                        return;
                    }

                    it(fmt("returns JSON of all %s species with provided '%s' prop regardless of Case", speciesName, tSpeciesPropName), function () {
                        var queryProps = {species: speciesName, ignoreCase: [tSpeciesPropName]};
                        var randOption = getRandomOptionValue(tSpeciesPropData);

                        queryProps[tSpeciesPropName] = alterCase(randOption);

                        return database.saveAnimal(speciesName, queryProps)
                            .then(function () {
                                return request.post(tHelper.buildEndpoint('species', 'all', 'query'))
                                    .send(queryProps)
                                    .set('Accept', 'application/json')
                                    .expect('Content-Type', /json/)
                                    .expect(tHelper.buildAnimalTest(_.omit(queryProps, ['ignoreCase']), speciesTestProps))
                                    .expect(200)
                            })
                    });
                })
            });

        });
    });
});
