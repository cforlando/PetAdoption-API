var url = require('url'),
    util = require('util'),
    path = require('path'),
    fs = require('fs'),

    request = require('supertest'),
    _ = require('lodash'),

    Debuggable = require('../../../../core/lib/debuggable'),
    APIDatabase = require('../../../../core/mongodb'),
    APIDatabaseFormatter = require('../../../../core/server/utils/formatter'),

    Server = require('../../../../core/server'),
    speciesDBImages = require('../../../test-db-images.js'),
    dump = function (obj) {
        return util.inspect(obj, {color: true});
    },
    sprintf = util.format;

// NOTE helper functions declared at bottom

describe("Router", function () {
    var apiDatabase,
        server;

    beforeAll(function (done) {
        apiDatabase = new APIDatabase({
            forcePreset: true,
            preset: speciesDBImages,
            debugLevel: Debuggable.PROD,
            modelNamePrefix: 'test_api_',
            onInitialized: function () {
                server = new Server(apiDatabase, {debugLevel: Debuggable.PROD});
                done();
            }
        });
    });

    afterAll(function (done) {
        apiDatabase.stop(done);
    });

    describe("test data", function () {

        it("is initialized correctly", function () {
            expect(_.isArray(speciesDBImages)).toBe(true);
            _.forEach(speciesDBImages, function (dbConfig) {
                expect(_.isString(dbConfig.getSpeciesName())).toBe(true);
                expect(dbConfig.getSpeciesProps()).not.toBeUndefined();
                expect(_.isArray(dbConfig.getAnimals())).toBe(true);
            });
        });
    });

    describe("test functions", function () {

        describe("buildEndpoint()", function () {

            it("returns correct values", function () {
                expect(buildEndpoint('save', 'cat')).toMatch(/^\/api\/v1\/save\/cat\/?$/);
                expect(buildEndpoint('remove', 'cat')).toMatch(/^\/api\/v1\/remove\/cat\/?$/);
                expect(buildEndpoint('model', 'dog')).toMatch(/^\/api\/v1\/model\/dog\/?$/);
                expect(buildEndpoint('options', 'dog')).toMatch(/\/api\/v1\/options\/dog\/?$/);
                expect(buildEndpoint('query')).toMatch(/^\/api\/v1\/query\/?$/);
                expect(buildEndpoint('species')).toMatch(/^\/api\/v1\/species\/?$/);
                expect(buildEndpoint('list', 'dog')).toMatch(/^\/api\/v1\/list\/dog\/?$/);
                expect(buildEndpoint('list', 'dog', {pageSize: 5})).toMatch(/^\/api\/v1\/list\/dog\?pageSize=5$/);
                expect(buildEndpoint('list', 'dog', {
                    page: 2,
                    pageSize: 5
                })).toMatch(/^\/api\/v1\/list\/dog\/2\?pageSize=5$/);
                expect(buildEndpoint('list', 'dog', {
                    properties: ['species', 'propName']
                })).toEqual(sprintf('/api/v1/list/dog?properties=%s', encodeURIComponent("['species','propName']")));
            })
        })
    });

    describe("API", function () {

        describe("/species", function () {

            it("returns an array of available species", function (done) {

                request(server)
                    .get(buildEndpoint('species'))
                    .set('Accept', 'application/json')
                    .expect('Content-Type', /json/)
                    .expect(function (res) {
                        expect(_.isArray(res.body)).toBe(true, 'response is an array');
                        expect(res.body.length).toEqual(speciesDBImages.length, 'response is an array');
                    })
                    .expect(200, buildJasmineCallback(done))
            });
        });

        _.forEach(speciesDBImages, function (dbImage) {
            var speciesName = dbImage.getSpeciesName(),
                speciesProps = dbImage.getSpeciesProps(),
                optionsData = _.reduce(speciesProps, function (collection, propData) {
                    collection[propData.key] = propData.options || [];
                    return collection;
                }, {});

            beforeAll(function (done) {

                var dbFormatter = new APIDatabaseFormatter({
                    createMissingFields: true,
                    populateEmptyFields: true
                });

                dbFormatter.formatDB(apiDatabase, speciesProps, {
                    complete: function () {
                        done();
                    }
                })
            });

            describe("V1", function () {
                it(sprintf("returns metaData for %s property values", speciesName), function (done) {
                    request(server)
                        .get(buildEndpoint('list', speciesName), {base: '/api/v1/'})
                        .set('Accept', 'application/json')
                        .expect('Content-Type', /json/)
                        .expect(function (res) {
                            _.forEach(res.body, function (animal) {
                                _.forEach(animal, function (animalPropData, propName) {
                                    if (!_.isPlainObject(animalPropData)) {
                                        throw new Error(sprintf("a %s did not return an object for %s", speciesName, propName));
                                    }
                                    expect(animalPropData.val).not.toBeUndefined(sprintf('%s.val not defined', dump(animal)));
                                    expect(animalPropData.example).not.toBeUndefined(sprintf('%s.example not defined', dump(animal)));
                                    expect(animalPropData.defaultVal).not.toBeUndefined();
                                    expect(animalPropData.valType).not.toBeUndefined();
                                    expect(animalPropData.key).not.toBeUndefined();
                                    expect(animalPropData.options).not.toBeUndefined();
                                    if (propName != 'images') expect(animalPropData.fieldLabel).not.toBeUndefined();
                                });
                            })
                        })
                        .expect(200, buildJasmineCallback(done))
                })
            });

            describe("V2", function () {
                it(sprintf("only returns actual values for %s properties", speciesName), function (done) {
                    request(server)
                        .get(buildEndpoint('list', speciesName, {base: '/api/v2/'}))
                        .set('Accept', 'application/json')
                        .expect('Content-Type', /json/)
                        .expect(function (res) {
                            _.forEach(res.body, function (animalProps) {
                                _.forEach(animalProps, function (propData, propName) {
                                    if (_.isPlainObject(propData))  throw new Error(sprintf("a %s returned an object for %s", speciesName, propName))
                                });
                            })
                        })
                        .expect(200, buildJasmineCallback(done))
                })
            });

            describe(sprintf("GET options/%s/", speciesName), function () {

                it(sprintf("returns a JSON array of all options for %s species", speciesName), function (done) {

                    request(server)
                        .get(buildEndpoint('options', speciesName))
                        .set('Accept', 'application/json')
                        .expect('Content-Type', /json/)
                        .expect(function (res) {
                            var responseOptions = res.body;
                            _.forEach(optionsData, function (singleOptionData, singleOptionName) {
                                _.forEach(singleOptionData, function (option) {
                                    var responseOptionData = responseOptions[singleOptionName];
                                    expect(_.includes(responseOptionData, option)).toBe(true, sprintf("%s should contain '%s'", dump(responseOptionData), option));
                                })
                            })
                        })
                        .expect(200, buildJasmineCallback(done))
                });

                describe(":optionName/", function () {

                    _.forEach(optionsData, function (optionList, optionName) {

                        it(sprintf("returns JSON array of options for %s", optionName), function (done) {

                            request(server)
                                .get(buildEndpoint('options', speciesName, {value: optionName}))
                                .set('Accept', 'application/json')
                                .expect('Content-Type', /json/)
                                .expect(function (res) {
                                    var responseOptions = res.body;
                                    _.forEach(optionsData[optionName], function (option) {
                                        expect(_.includes(responseOptions, option)).toBe(true, sprintf("%s should contain '%s'", dump(responseOptions), option));
                                    })
                                })
                                .expect(200, buildJasmineCallback(done))
                        });
                    });
                })
            });

            describe(sprintf("GET list/%s/", speciesName), function () {

                it(sprintf("returns JSON of all %s species", speciesName), function (done) {
                    request(server)
                        .get(buildEndpoint('list', speciesName))
                        .set('Accept', 'application/json')
                        .expect('Content-Type', /json/)
                        .expect(function (res) {
                            if (!_.isArray(res.body)) throw new Error(special("list/%s did not return array", speciesName));
                            if (res.body.length > 0) {
                                _.forEach(res.body, function (petData, index) {
                                    if (petData['species'].val != speciesName) throw new Error(sprintf("list/%s return a pet with incorrect species at index %s", speciesName, index))
                                })
                            }
                            if (speciesName == 'dog') {
                                if (!(res.body.length > 0)) throw new Error("list/dog/ did not return any results")
                            }
                        })
                        .expect(200, buildJasmineCallback(done))
                });

                it(sprintf("returns a paged JSON of all %s species", speciesName), function (done) {
                    var pageSize = 3;

                    request(server)
                        .get(buildEndpoint('list', speciesName))
                        .set('Accept', 'application/json')
                        .expect('Content-Type', /json/)
                        .end(function (err, fullListResponse) {
                            request(server)
                                .get(buildEndpoint('list', speciesName, {value: 1, pageSize: pageSize}))
                                .set('Accept', 'application/json')
                                .expect('Content-Type', /json/)
                                .expect(function (paramedListResponse) {
                                    if (!_.isArray(paramedListResponse.body)) throw new Error(sprintf("list/%s did not return array", speciesName));
                                    if (fullListResponse.body.length > pageSize && paramedListResponse.body.length != pageSize) throw new Error(sprintf("list/%s return %s instead of %s pets", speciesName, paramedListResponse.body.length, pageSize));
                                    if (paramedListResponse.body.length > 0) {
                                        _.forEach(paramedListResponse.body, function (petData, index) {
                                            if (petData['species'].val != speciesName) throw new Error(sprintf("list/%s return a pet with incorrect species at index %s", speciesName, index))
                                        })
                                    }
                                    if (speciesName == 'dog') {
                                        if (!(paramedListResponse.body.length > 0)) throw new Error("list/dog/ did not return any results")
                                    }
                                })
                                .expect(200, buildJasmineCallback(done))
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
                            if (res.body.length > 0) {
                                var expectedNumOfProperties = properties.length;
                                _.forEach(res.body, function (petData, index) {
                                    if (petData['species'].val != speciesName) throw new Error(sprintf("list/%s return a pet with incorrect species at index %s", speciesName, index));
                                    var numOfProperties = Object.keys(petData).length;
                                    if (numOfProperties != expectedNumOfProperties) throw new Error(sprintf("Received incorrect number of properties %s != %s", numOfProperties, expectedNumOfProperties))
                                })
                            }
                            if (speciesName == 'dog') {
                                if (!(res.body.length > 0)) throw new Error("list/dog/ did not return any results")
                            }
                        })
                        .expect(200, buildJasmineCallback(done))
                })
            });

            var testPetDataWithIDSansSpecies = {
                    petName: 'erred pet',
                    age: '10 years',
                    petId: 'daskljfasdkljfasdasdf'
                },
                testPetData = {
                    petName: 'success pet',
                    species: speciesName,
                    age: '10 years'
                };

            describe(sprintf("POST save/%s/model", speciesName), function () {

                it("returns 401 when unauthorized save species request made", function (done) {

                    request(server)
                        .post(buildEndpoint('save', speciesName))
                        .type('form')
                        .set('Accept', 'application/json')
                        .send(testPetDataWithIDSansSpecies)
                        .expect(401, buildJasmineCallback(done))
                });
            });

            describe(sprintf("POST save/%s", speciesName), function () {

                it("returns 401 when unauthorized save animal request made", function (done) {

                    request(server)
                        .post(buildEndpoint('save', speciesName))
                        .type('form')
                        .set('Accept', 'application/json')
                        .send(testPetDataWithIDSansSpecies)
                        .expect(401, buildJasmineCallback(done))
                });
            });

            describe("POST user/", function () {

                it("returns 401 when unauthorized user request made", function (done) {

                    request(server)
                        .get(buildEndpoint('user'))
                        .set('Accept', 'application/json')
                        .expect(401, buildJasmineCallback(done))
                });
            });

            describe(sprintf("POST save/%s/ and POST remove/%s/", speciesName, speciesName), function () {
                pending("Authentication required");

                it(sprintf("can save and delete a %s", speciesName), function (done) {
                    request(server)
                        .post(buildEndpoint('save', speciesName))
                        .type('form')
                        .set('Accept', 'application/json')
                        .expect('Content-Type', /json/)
                        .send(testPetData)
                        .expect(function (response) {
                            var petId = response.body.petId.val;
                            if (!isValidID(petId)) throw new Error(sprintf("Save %s produced an invalid id", speciesName, petId));
                            _.forEach(testPetData, function (propVal, propName) {
                                var savedValue = response.body[propName].val;
                                if (propVal != savedValue) throw new Error(sprintf("Pet data was incorrectly saved: %s(saved) != %s", savedValue, propVal))
                            });
                        })
                        .expect(200, function (response) {
                            if (!response.body.petId) throw new Error(sprintf("%s was not saved", speciesName));
                            request(server)
                                .post(buildEndpoint('remove', speciesName))
                                .set('Accept', 'application/json')
                                .expect('Content-Type', /json/)
                                .send({
                                    species: speciesName,
                                    petId: response.body.petId.val
                                })
                                .expect(200, buildJasmineCallback(done))
                        })
                })
            });

            describe(sprintf("POST remove/%s/", speciesName), function () {
                pending("Authentication required");

                it(sprintf("returns error on invalid request to delete a %s", speciesName), function (done) {
                    request(server)
                        .post(buildEndpoint('remove', speciesName))
                        .send({
                            species: speciesName,
                            petId: 'asdfa90sdfdsfajsdl'
                        })
                        .expect(404, buildJasmineCallback(done))
                });

            });

            describe("POST query/", function () {
                var speciesTestProps = _.reject(speciesProps, function (propData) {
                    return _.includes(['petId', 'description', 'images', 'defaults', 'test'], propData.key)
                });

                it("accepts query when species field not provided", function (done) {
                    var queryProps = {
                        color: "White"
                    };
                    request(server)
                        .post(buildEndpoint('query'))
                        .set('Accept', 'application/json')
                        .send(queryProps)
                        .expect(200, buildJasmineCallback(done))
                });

                _.forEach(speciesTestProps, function (tSpeciesPropData) {
                    var tSpeciesPropName = tSpeciesPropData.key;
                    // TODO implement tests for location
                    if (tSpeciesPropData.valType == 'Location') {
                        // skip location fields
                        return;
                    }


                    var queryProps = {species: speciesName};

                    queryProps[tSpeciesPropName] = getRandomOptionValue(tSpeciesPropData);

                    it("returns only request parameters when 'properties' key provided", function (done) {
                        var properties = ['species', 'petName'],
                            queryWithProperties = _.defaults({properties: properties}, queryProps);
                        request(server)
                            .post(buildEndpoint('query'))
                            .set('Accept', 'application/json')
                            .expect('Content-Type', /json/)
                            .send(queryWithProperties)
                            .expect(buildAnimalTest(_.pick(queryWithProperties, properties), speciesTestProps))
                            .expect(function (res) {
                                if (!_.isArray(res.body)) throw new Error(sprintf("list/%s did not return array", speciesName));
                                // if (res.body.length != pageSize) throw new Error(sprintf("list/%s return %s instead of %s pets", species, res.body.length, pageSize));
                                if (res.body.length > 0) {
                                    var expectedNumOfProperties = properties.length;
                                    _.forEach(res.body, function (petData, index) {
                                        var speciesRegex = new RegExp(escapeRegExp(petData['species'].val), 'i');
                                        if (!speciesRegex.test(queryProps['species'])) throw new Error(sprintf("query w/ properties return a pet with incorrect species (%s != %s) at index %s", petData['species'].val, queryProps['species'], index));
                                        var keys = Object.keys(petData),
                                            numOfProperties = keys.length;
                                        if (numOfProperties != expectedNumOfProperties) throw new Error(sprintf("Received incorrect number of properties %s != %s (%s)", numOfProperties, expectedNumOfProperties, keys))
                                    })
                                }
                            })
                            .expect(200, buildJasmineCallback(done))
                    });


                    it(sprintf("returns JSON of all %s species with provided %s prop", speciesName, tSpeciesPropName), function (done) {
                        request(server)
                            .post(buildEndpoint('query'))
                            .send(queryProps)
                            .set('Accept', 'application/json')
                            .expect('Content-Type', /json/)
                            .expect(buildAnimalTest(queryProps, speciesTestProps))
                            .expect(200, buildJasmineCallback(done))
                    })
                });

                describe("when multiple params are provided", function () {
                    var queryProps = {species: speciesName},
                        testProps = [];

                    _.forEach(speciesTestProps, function (tSpeciesPropData) {
                        var tSpeciesPropName = tSpeciesPropData.key;
                        queryProps[tSpeciesPropName] = getRandomOptionValue(tSpeciesPropData);
                        testProps.push(_.extend({}, queryProps));
                    });

                    _.forEach(testProps, function (queryProps) {

                        it(sprintf("returns JSON of all %s species with provided '%s' props", speciesName, Object.keys(queryProps).join(", ")), function (done) {
                            request(server)
                                .post(buildEndpoint('query'))
                                .send(queryProps)
                                .set('Accept', 'application/json')
                                .expect('Content-Type', /json/)
                                .expect(buildAnimalTest(queryProps, speciesTestProps))
                                .expect(200, buildJasmineCallback(done))
                        })

                    })
                });

                describe("when ignoreCase flag is set", function () {
                    _.forEach(speciesTestProps, function (tSpeciesPropData) {
                        var tSpeciesPropName = tSpeciesPropData.key;
                        //skip non-string values
                        if (tSpeciesPropData.valType.toLowerCase() != 'string') return;

                        var queryProps = {species: speciesName, ignoreCase: [tSpeciesPropName]},
                            randOption = getRandomOptionValue(tSpeciesPropData);


                        queryProps[tSpeciesPropName] = alterCase(randOption);
                        it(sprintf("returns JSON of all %s species with provided '%s' prop regardless of Case", speciesName, tSpeciesPropName), function (done) {
                            request(server)
                                .post(buildEndpoint('query'))
                                .send(queryProps)
                                .set('Accept', 'application/json')
                                .expect('Content-Type', /json/)
                                .expect(buildAnimalTest(_.omit(queryProps, ['ignoreCase']), speciesTestProps))
                                .expect(200, buildJasmineCallback(done))
                        })

                    })
                });
            });

        });
    });

});


function alterCase(str) {
    var randIndex = Math.floor(Math.random() * str.length);
    return str.substr(0, randIndex).toUpperCase() + str.substr(randIndex).toLowerCase();
}

/**
 *
 * @param {String} operation
 * @param {String} [species]
 * @param {Object} [options]
 * @param {String|Number} [options.value]
 * @param {String|Number} [options.pageSize]
 * @param {String|Number} [options.page]
 * @param {String} [options.base='/api/v1/']
 * @returns {string}
 */
function buildEndpoint(operation, species, options) {
    var _options = _.extend({
            base: '/api/v1/'
        }, _.isString(species) ? options : species),
        base = _options.base,
        endpoint = '';
    if (!(operation)) throw new Error("buildEndpoint() - No operation received");
    switch (operation) {
        case 'list':
        case 'query':
        case 'model':
        case 'save':
        case 'species':
        case 'remove':
        case 'user':
        case 'options':
            endpoint = path.join(base, '/' + operation);
            break;
        case '/':
        case 'root':
        case 'home':
        default:
            endpoint = '/';
            break;
    }

    if (species) endpoint = path.join(endpoint, '/' + species);


    if (_options.value) {
        endpoint = path.join(endpoint, '/' + options.value.toString());
    }
    if (_options.page) {
        endpoint = path.join(endpoint, '/' + options.page.toString());
    }
    var queryProps = {};
    if (_options.pageSize) queryProps['pageSize'] = _options.pageSize;
    if (_options.properties) queryProps['properties'] = "['" + _options.properties.join("'\,'") + "']";

    return (Object.keys(queryProps).length > 0) ? endpoint + url.format({query: queryProps}) : endpoint;
}

function buildJasmineCallback(done) {
    return function (err, response) {
        if (err) {
            if (response) console.error('jasmine err response.body: %j' + response.body);
            console.error(err);
            done.fail(err)
        } else {
            done()
        }
    }
}

function isValidID(petId) {
    return /^[0-9a-fA-F]{24}$/.test(petId)
}

function escapeRegExp(str) {
    return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
}

function getRandomOptionValue(propData) {
    var options = propData.options,
        result;
    if (options && options.length > 0) {
        var randOptionIndex = Math.floor(Math.random() * options.length);
        result = options[randOptionIndex];
        return result;
    }
    result = propData.example || propData.defaultVal;
    switch (propData.valType) {
        case 'Location':
        case 'Number':
            if (_.isNumber(result)) {
                result = parseFloat(result);
            } else {
                // TODO implement better handling of invalid number type options
                result = -1;
            }
            break;
        case 'Date':
            var today = new Date(result);
            result = today.toISOString();
            break;
        default:
    }
    if (result === null || result === undefined) throw new Error(sprintf("Cannot generate test option for '%j'", propData.key || propData));
    return result;
}

/**
 *
 * @param queryProps
 * @param speciesProps
 * @returns {Function}
 */
function buildAnimalTest(queryProps, speciesProps) {
    return function (res) {
        if (!_.isArray(res.body)) throw new Error(sprintf("received %s instead of an array", typeof res.body));
        var numOfPets = res.body.length;
        if (numOfPets == 0) return;
        _.forEach(res.body, function (animalProps, index) {
            _.forEach(queryProps, function (expectedValue, propName) {

                // check if property exists
                if (_.isUndefined(animalProps[propName])) throw new Error(sprintf('(%s/%s) Received undefined actualValue for "%s" (should be %s)', index, numOfPets, propName, expectedValue));

                var actualValue = animalProps[propName].val;
                var speciesPropData = _.find(speciesProps, {key: propName});

                if (speciesPropData.valType === 'String') {
                    // if a string check if they match regardless of case, (ie case of species)
                    var testRegex = new RegExp(escapeRegExp(expectedValue), 'i');
                    if (testRegex.test(actualValue)) return;
                } else if (speciesPropData.valType === 'Date') {
                    var testDate = new Date(expectedValue),
                        actualDate = new Date(actualValue);

                    if (actualDate.toISOString() === testDate.toISOString()) return;
                } else if (speciesPropData.valType == 'Boolean') {
                    var expectedBoolValue = expectedValue;
                    if (expectedBoolValue.match(/y|yes/i)){
                        expectedBoolValue = true;
                    } else if(expectedBoolValue.match(/\w+/i)){
                        // default to false
                        expectedBoolValue = false;
                    }
                    if (actualValue === expectedBoolValue) return;
                } else if (actualValue == expectedValue) {
                    // actualValues are equal
                    return;
                } else if (actualValue.length && actualValue[0] == expectedValue[0]) {
                    // actualValues are equal
                    return;
                }
                throw new Error(sprintf('(%s/%s) Received incorrect match for "%s": %s(%s) != %s(%s)', index, numOfPets, propName, actualValue, util.inspect(actualValue, {colors: true}), expectedValue, util.inspect(expectedValue, {colors: true})));
            });
        })
    }
}
