var url = require('url'),
    util = require('util'),
    path = require('path'),
    fs = require('fs'),

    request = require('supertest'),
    _ = require('lodash'),

    server = require('../../../core/server'),
    serverUtils = require('../../../core/server/utils');


var domain = require('../../../core/config').domain,
    apiEndpoint = url.resolve(domain, 'api/v1/'),
    modelsData = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'data/models.json'), {encoding: 'utf8'})),
    optionsData = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'data/options.json'), {encoding: 'utf8'})),
    sprintf = util.format,
    speciesList = ['dog', 'cat'];

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
            result = parseFloat(result);
            break;
        case 'Date':
            result = new Date(result);
            break;
        default:
    }
    if (result === null || result === undefined) throw new Error(sprintf("Cannot generate test option for '%s'", propData.key));
    return result;
}

function alterCase(str) {
    var randIndex = Math.floor(Math.random() * str.length);
    return str.substr(0, randIndex).toUpperCase() + str.substr(randIndex).toLowerCase();
};

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
        case 'remove':
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
    if (_options.pageSize) queryProps['pageSize'] = _options.pageSize
    if (_options.properties) queryProps['properties'] = "['" + _options.properties.join("'\,'") + "']";

    return (Object.keys(queryProps).length > 0) ? endpoint + url.format({query: queryProps}) : endpoint;
}

function buildJasmineCallback(done) {
    return function (err) {
        if (err) {
            done.fail(err)
        } else {
            done()
        }
    }
}

describe("Test functions", function () {
    describe("buildEndpoint", function () {

        it("returns correct values", function () {
            expect(buildEndpoint('save', 'cat')).toMatch(/^\/api\/v1\/save\/cat\/?$/);
            expect(buildEndpoint('remove', 'cat')).toMatch(/^\/api\/v1\/remove\/cat\/?$/);
            expect(buildEndpoint('model', 'dog')).toMatch(/^\/api\/v1\/model\/dog\/?$/);
            expect(buildEndpoint('options', 'dog')).toMatch(/\/api\/v1\/options\/dog\/?$/);
            expect(buildEndpoint('query')).toMatch(/^\/api\/v1\/query\/?$/);
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


_.forEach(speciesList, function (species) {

    describe("V1 format", function () {
        var speciesTestModel = modelsData[species];
        it(sprintf("returns metaData for %s property values", species), function (done) {
            request(server.app)
                .get(buildEndpoint('list', species), {base: '/api/v2/'})
                .set('Accept', 'application/json')
                .expect('Content-Type', /json/)
                .expect(function (res) {
                    _.forEach(res.body, function (animalProps) {
                        _.forEach(animalProps, function (propData, propName) {
                            var expectedNumOfKeys = _.keys(speciesTestModel[propName]).length,
                                numOfKeys = _.keys(propData).length;
                            if (!_.isPlainObject(propData)) throw new Error("a %s did not return an object for %s", species, propName);
                            if (numOfKeys <= expectedNumOfKeys) throw new Error(sprintf("a %s didn't return all meta info keys for %s (%s != %s)", species, propName, numOfKeys, expectedNumOfKeys))
                        });
                    })
                })
                .expect(200, buildJasmineCallback(done))
        })
    });
    describe("V2 format", function () {
        it(sprintf("only returns actual values for %s properties", species), function (done) {
            request(server.app)
                .get(buildEndpoint('list', species, {base: '/api/v2/'}))
                .set('Accept', 'application/json')
                .expect('Content-Type', /json/)
                .expect(function (res) {
                    var expectedNumOfKeys = 0;
                    _.forEach(res.body, function (animalProps) {
                        _.forEach(animalProps, function (propData, propName) {
                            if (_.isPlainObject(propData))  throw new Error(sprintf("a %s returned an object for %s", species, propName))
                        });
                    })
                })
                .expect(200, buildJasmineCallback(done))
        })
    });

    describe(sprintf("GET options/%s/", species), function () {

        it(sprintf("returns a JSON array of all options for %s species", species), function (done) {

            request(server.app)
                .get(buildEndpoint('options', species))
                .set('Accept', 'application/json')
                .expect('Content-Type', /json/)
                .expect(200, optionsData[species], buildJasmineCallback(done))
        });

        describe(":optionName/", function () {

            _.forEach(optionsData[species], function (optionList, optionName) {

                it(sprintf("returns JSON array of options for %s", optionName), function (done) {

                    request(server.app)
                        .get(buildEndpoint('options', species, {value: optionName}))
                        .set('Accept', 'application/json')
                        .expect('Content-Type', /json/)
                        .expect(200, optionsData[species][optionName], buildJasmineCallback(done))
                });
            });
        })
    });

    describe(sprintf("GET list/%s/", species), function () {

        it(sprintf("returns JSON of all %s species", species), function (done) {
            request(server.app)
                .get(buildEndpoint('list', species))
                .set('Accept', 'application/json')
                .expect('Content-Type', /json/)
                .expect(function (res) {
                    if (!_.isArray(res.body)) throw new Error(special("list/%s did not return array", species));
                    if (res.body.length > 0) {
                        _.forEach(res.body, function (petData, index) {
                            if (petData['species'].val != species) throw new Error(sprintf("list/%s return a pet with incorrect species at index %s", species, index))
                        })
                    }
                    if (species == 'dog') {
                        if (!(res.body.length > 0)) throw new Error("list/dog/ did not return any results")
                    }
                })
                .expect(200, buildJasmineCallback(done))
        });

        it(sprintf("returns a paged JSON of all %s species", species), function (done) {
            var pageSize = 3;

            request(server.app)
                .get(buildEndpoint('list', species))
                .set('Accept', 'application/json')
                .expect('Content-Type', /json/)
                .end(function (err, fullListResponse) {
                    request(server.app)
                        .get(buildEndpoint('list', species, {value: 1, pageSize: pageSize}))
                        .set('Accept', 'application/json')
                        .expect('Content-Type', /json/)
                        .expect(function (paramedListResponse) {
                            if (!_.isArray(paramedListResponse.body)) throw new Error(sprintf("list/%s did not return array", species));
                            if (fullListResponse.body.length > pageSize && paramedListResponse.body.length != pageSize) throw new Error(sprintf("list/%s return %s instead of %s pets", species, paramedListResponse.body.length, pageSize));
                            if (paramedListResponse.body.length > 0) {
                                _.forEach(paramedListResponse.body, function (petData, index) {
                                    if (petData['species'].val != species) throw new Error(sprintf("list/%s return a pet with incorrect species at index %s", species, index))
                                })
                            }
                            if (species == 'dog') {
                                if (!(paramedListResponse.body.length > 0)) throw new Error("list/dog/ did not return any results")
                            }
                        })
                        .expect(200, buildJasmineCallback(done))
                })
        });

        it("returns only request parameters when 'properties' key provided", function (done) {
            var properties = ['species', 'petName'];
            request(server.app)
                .get(buildEndpoint('list', species, {properties: properties}))
                .set('Accept', 'application/json')
                .expect('Content-Type', /json/)
                .expect(function (res) {
                    if (!_.isArray(res.body)) throw new Error(sprintf("list/%s did not return array", species));
                    if (res.body.length > 0) {
                        var expectedNumOfProperties = properties.length;
                        _.forEach(res.body, function (petData, index) {
                            if (petData['species'].val != species) throw new Error(sprintf("list/%s return a pet with incorrect species at index %s", species, index));
                            var numOfProperties = Object.keys(petData).length;
                            if (numOfProperties != expectedNumOfProperties) throw new Error(sprintf("Received incorrect number of properties %s != %s", numOfProperties, expectedNumOfProperties))
                        })
                    }
                    if (species == 'dog') {
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
            species: species,
            age: '10 years'
        };

    describe(sprintf("POST save/%s", species), function () {

        it("returns an error when invalid petId provided", function (done) {

            request(server.app)
                .post(buildEndpoint('save', species))
                .type('form')
                .set('Accept', 'application/json')
                .send(testPetDataWithIDSansSpecies)
                .expect(404, buildJasmineCallback(done))
        });
    });

    fdescribe(sprintf("POST save/%s/ and POST remove/%s/", species, species), function () {

        it(sprintf("can save and delete a %s", species), function (done) {
            request(server.app)
                .post(buildEndpoint('save', species))
                .type('form')
                .set('Accept', 'application/json')
                .expect('Content-Type', /json/)
                .send(testPetData)
                .expect(function (response) {
                    var petId = response.body.petId.val;
                    if (!isValidID(petId)) throw new Error(sprintf("Save %s produced an invalid id", species, petId));
                    _.forEach(testPetData, function (propVal, propName) {
                        var savedValue = response.body[propName].val;
                        if (propVal != savedValue) throw new Error(sprintf("Pet data was incorrectly saved: %s(saved) != %s", savedValue, propVal))
                    });
                })
                .end(function (err, savedPet) {

                    request(server.app)
                        .post(buildEndpoint('remove', species))
                        .set('Accept', 'application/json')
                        .expect('Content-Type', /json/)
                        .send({
                            species: species,
                            petId: savedPet.body.petId.val
                        })
                        .expect(200, buildJasmineCallback(done))
                })
        })
    });

    describe(sprintf("POST remove/%s/", species), function () {

        it(sprintf("returns error on invalid request to delete a %s", species), function (done) {
            request(server.app)
                .post(buildEndpoint('remove', species))
                .send({
                    species: species,
                    petId: 'asdfa90sdfdsfajsdl'
                })
                .expect(404, buildJasmineCallback(done))
        });

    });

    describe("POST query/", function () {
        var speciesTestModel = _.omit(modelsData[species], ['petId', 'description', 'images']);

        function buildTest(queryProps) {
            return function (res) {
                if (!_.isArray(res.body)) throw new Error(sprintf("received %s instead of an array", typeof res.body));
                var numOfPets = res.body.length;
                if (numOfPets == 0) return;
                _.forEach(res.body, function (animalProps, index) {
                    _.forEach(queryProps, function (expectedValue, propName) {

                        // check if property exists
                        if (_.isUndefined(animalProps[propName])) throw new Error(sprintf('(%s/%s) Received undefined actualValue for "%s" (should be %s)', index, numOfPets, propName, expectedValue));

                        var actualValue = animalProps[propName].val;

                        if (speciesTestModel[propName].valType === 'String') {
                            // if a string check if they match regardless of case, (ie case of species)
                            var testRegex = new RegExp(escapeRegExp(expectedValue), 'i');
                            if (testRegex.test(actualValue)) return;
                        } else if (speciesTestModel[propName].valType === 'Date') {
                            var testDate = new Date(expectedValue),
                                actualDate = new Date(actualValue);

                            if (actualDate.toISOString() === testDate.toISOString()) return;
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

        _.forEach(speciesTestModel, function (propData, propName) {
            var queryProps = {species: species};

            queryProps[propName] = getRandomOptionValue(propData);

            it("returns only request parameters when 'properties' key provided", function (done) {
                var properties = ['species', 'petName'],
                    queryWithProperties = _.defaults({properties: properties}, queryProps);
                request(server.app)
                    .post(buildEndpoint('query'))
                    .set('Accept', 'application/json')
                    .expect('Content-Type', /json/)
                    .send(queryWithProperties)
                    .expect(buildTest(_.pick(queryWithProperties, properties)))
                    .expect(function (res) {
                        if (!_.isArray(res.body)) throw new Error(sprintf("list/%s did not return array", species));
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

            it(sprintf("returns JSON of all %s species with provided %s prop", species, propName), function (done) {
                request(server.app)
                    .post(buildEndpoint('query'))
                    .send(queryProps)
                    .set('Accept', 'application/json')
                    .expect('Content-Type', /json/)
                    .expect(buildTest(queryProps))
                    .expect(200, buildJasmineCallback(done))
            })
        });

        describe("when multiple params are provided", function () {
            var queryProps = {species: species},
                testProps = [];

            _.forEach(speciesTestModel, function (propData, propName) {
                queryProps[propName] = getRandomOptionValue(propData);
                testProps.push(_.extend({}, queryProps));
            });

            _.forEach(testProps, function (queryProps) {

                it(sprintf("returns JSON of all %s species with provided '%s' props", species, Object.keys(queryProps).join(", ")), function (done) {
                    request(server.app)
                        .post(buildEndpoint('query'))
                        .send(queryProps)
                        .set('Accept', 'application/json')
                        .expect('Content-Type', /json/)
                        .expect(buildTest(queryProps))
                        .expect(200, buildJasmineCallback(done))
                })

            })
        });

        describe("when ignoreCase flag is set", function () {
            _.forEach(speciesTestModel, function (propData, propName) {
                var queryProps = {species: species, ignoreCase: [propName]},
                    randOption = getRandomOptionValue(propData);

                //skip non-string values
                if (!_.isString(randOption)) return;

                queryProps[propName] = alterCase(randOption);
                it(sprintf("returns JSON of all %s species with provided '%s' prop regardless of Case", species, propName), function (done) {
                    request(server.app)
                        .post(buildEndpoint('query'))
                        .send(queryProps)
                        .set('Accept', 'application/json')
                        .expect('Content-Type', /json/)
                        .expect(buildTest(_.omit(queryProps, ['ignoreCase'])))
                        .expect(200, buildJasmineCallback(done))
                })

            })
        });
    });

});

