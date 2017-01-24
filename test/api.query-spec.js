var url = require('url'),
    util = require('util'),
    path = require('path'),
    fs = require('fs'),

    request = require('supertest'),
    async = require('async'),
    _ = require('lodash'),
    expect = require('expect.js'),

    Species = require('../core/lib/species'),

    TestHelper = require('./helper'),

    tHelper = new TestHelper(),
    speciesDBImages = tHelper.getTestDBImages(),
    str = tHelper.sprintf,
    alterCase = tHelper.alterCase,
    buildEndpoint = tHelper.buildEndpoint,
    buildJasmineRequestCallback = tHelper.buildJasmineRequestCallback,
    buildAnimalTest = tHelper.buildAnimalTest,
    getRandomOptionValue = tHelper.getRandomOptionValue,

    database,
    server;

describe("/query", function () {

    before(function (done) {
        this.timeout(20 * 1000);
        tHelper.beforeAPI()
            .then(function (testComponents) {
                server = testComponents.server;
                database = testComponents.database;
                done();
            })
            .catch(done)
    });

    after(function (done) {
        tHelper.afterAPI()
            .then(done)
            .catch(done)
    });

    it("accepts query when species field not provided", function (done) {
        var queryProps = {
            color: "White"
        };
        request(server)
            .post(buildEndpoint('query'))
            .set('Accept', 'application/json')
            .send(queryProps)
            .expect(200, buildJasmineRequestCallback(done))
    });

    describe('for each species', function () {

        speciesDBImages.forEach(function (dbImage) {

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
                if (tSpeciesPropData.valType == 'Location') {
                    // skip location fields
                    return;
                }


                queryProps[tSpeciesPropName] = getRandomOptionValue(tSpeciesPropData);

                it(str("returns JSON of all %s species with provided %s prop", speciesName, tSpeciesPropName), function (done) {

                    database.saveAnimal(speciesName, queryProps).then(function () {
                        request(server)
                            .post(buildEndpoint('query'))
                            .send(queryProps)
                            .set('Accept', 'application/json')
                            .expect('Content-Type', /json/)
                            .expect(buildAnimalTest(queryProps, speciesTestProps))
                            .expect(200, buildJasmineRequestCallback(done))
                    });
                });

                it("returns only requested properties when 'properties' key is defined", function (done) {
                    var properties = ['species', 'petId'],
                        queryWithProperties = Object.assign({properties: properties}, queryProps);

                    database.saveAnimal(speciesName, Object.assign({petName: "test-pet-" + index}, queryProps)).then(function (animalData) {
                        request(server)
                            .post(buildEndpoint('query'))
                            .set('Accept', 'application/json')
                            .expect('Content-Type', /json/)
                            .send(queryWithProperties)
                            .expect(buildAnimalTest(_.pick(queryWithProperties, properties), speciesTestProps))
                            .expect(function (res) {
                                if (res.body.length) {
                                    // test response data
                                    var expectedNumOfProperties = properties.length;

                                    res.body.forEach(function (petData) {

                                        var responsePetDataKeys = Object.keys(petData);

                                        if (responsePetDataKeys.length != expectedNumOfProperties) {
                                            throw new Error(str("Received incorrect number of properties %s != %s (%s)", responsePetDataKeys.length, expectedNumOfProperties, properties))
                                        }

                                        responsePetDataKeys.forEach(function (propName) {
                                            if (!_.includes(properties, propName)) throw new Error("Received incorrect prop: " + propName);
                                        });
                                    });
                                } else {
                                    // investigate further and throw err
                                    if (!_.isArray(res.body)) {
                                        throw new Error(str("list/%s did not return array", speciesName));
                                    } else {
                                        throw new Error(str("list/%s did not return any pets", speciesName));
                                    }
                                }
                            })
                            .expect(200, buildJasmineRequestCallback(done))
                    });
                });

            });

            describe("when multiple params are provided", function () {
                var queryProps = {species: speciesName};

                speciesTestProps.forEach(function (tSpeciesPropData) {

                    // add on to query with test iteration
                    var testInstanceProps = {};
                    testInstanceProps[tSpeciesPropData.key] = getRandomOptionValue(tSpeciesPropData);
                    queryProps = Object.assign(testInstanceProps, queryProps);
                    it(str("returns JSON of all %s species with provided '%s' props", speciesName, Object.keys(queryProps).join(", ")), function (done) {
                        database.saveAnimal(speciesName, queryProps).then(function () {

                            request(server)
                                .post(buildEndpoint('query'))
                                .send(queryProps)
                                .set('Accept', 'application/json')
                                .expect('Content-Type', /json/)
                                .expect(buildAnimalTest(queryProps, speciesTestProps))
                                .expect(200, buildJasmineRequestCallback(done))
                        })
                    })
                })
            });

            describe("when ignoreCase flag is set", function () {

                speciesTestProps.forEach(function (tSpeciesPropData) {
                    //skip non-string values
                    if (tSpeciesPropData.valType.toLowerCase() != 'string') return;

                    var tSpeciesPropName = tSpeciesPropData.key,
                        queryProps = {species: speciesName, ignoreCase: [tSpeciesPropName]},
                        randOption = getRandomOptionValue(tSpeciesPropData);

                    queryProps[tSpeciesPropName] = alterCase(randOption);

                    it(str("returns JSON of all %s species with provided '%s' prop regardless of Case", speciesName, tSpeciesPropName), function (done) {
                        database.saveAnimal(speciesName, queryProps).then(function () {
                            request(server)
                                .post(buildEndpoint('query'))
                                .send(queryProps)
                                .set('Accept', 'application/json')
                                .expect('Content-Type', /json/)
                                .expect(buildAnimalTest(_.omit(queryProps, ['ignoreCase']), speciesTestProps))
                                .expect(200, buildJasmineRequestCallback(done))
                        })
                    });
                })
            });

        });
    });
});
