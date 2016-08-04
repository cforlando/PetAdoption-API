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

function escapeRegExp(str) {
    return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
}

function getRandomOption(propData) {
    var options = propData.options,
        result;
    if (options && options.length > 0) {
        var randOptionIndex = Math.floor(Math.random() * options.length);
        result = options[randOptionIndex];
        return result;
    }
    result = propData.example || propData.defaultVal;
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
            expect(buildEndpoint('model', 'dog')).toMatch("/api/v1/model/dog");
            expect(buildEndpoint('options', 'dog')).toMatch("/api/v1/options/dog");
            expect(buildEndpoint('query')).toMatch(/^\/api\/v1\/query\/?$/);
            expect(buildEndpoint('list', 'dog')).toMatch(/^\/api\/v1\/list\/dog\/?$/);
            expect(buildEndpoint('list', 'dog', {pageSize: 5})).toMatch(/^\/api\/v1\/list\/dog\?pageSize=5$/);
            expect(buildEndpoint('list', 'dog', {
                page: 2,
                pageSize: 5
            })).toMatch(/^\/api\/v1\/list\/dog\/2\?pageSize=5$/);
            expect(buildEndpoint('list', 'dog', {
                properties: ['species', 'propName']
            })).toEqual(sprintf('/api/v1/list/dog?properties=%s',encodeURIComponent("['species','propName']")));
        })
    })
});



_.forEach(speciesList, function (species) {

    describe("V1 format", function(){
        var speciesTestModel = modelsData[species];
        it(sprintf("returns metaData for %s property values", species), function(done){
            request(server.app)
                .get(buildEndpoint('list', species), {base: '/api/v2/'})
                .set('Accept', 'application/json')
                .expect('Content-Type', /json/)
                .expect(function(res){
                    _.forEach(res.body, function(animalProps){
                        _.forEach(animalProps, function(propData, propName){
                            var expectedNumOfKeys = _.keys(speciesTestModel[propName]).length,
                                numOfKeys = _.keys(propData).length;
                           if(!_.isPlainObject(propData)) throw new Error("a %s did not return an object for %s", species, propName);
                            if(numOfKeys  <= expectedNumOfKeys) throw new Error(sprintf("a %s didn't return all meta info keys for %s (%s != %s)", species, propName, numOfKeys, expectedNumOfKeys))
                        });
                    })
                })
                .expect(200, buildJasmineCallback(done))
        })
    });
    describe("V2 format", function(){
        it(sprintf("only returns actual values for %s properties", species), function(done){
            request(server.app)
                .get(buildEndpoint('list', species, {base: '/api/v2/'}))
                .set('Accept', 'application/json')
                .expect('Content-Type', /json/)
                .expect(function(res){
                    var expectedNumOfKeys = 0;
                    _.forEach(res.body, function(animalProps){
                        _.forEach(animalProps, function(propData, propName){
                            if(_.isPlainObject(propData))  throw new Error(sprintf("a %s returned an object for %s", species, propName))
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
                .get(buildEndpoint('list', species, {value: 1, pageSize: pageSize}))
                .set('Accept', 'application/json')
                .expect('Content-Type', /json/)
                .expect(function (res) {
                    if (!_.isArray(res.body)) throw new Error(sprintf("list/%s did not return array", species));
                    if (res.body.length != pageSize) throw new Error(sprintf("list/%s return %s instead of %s pets", species, res.body.length, pageSize));
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
        })

        it("returns only request parameters when 'properties' key provided", function(done){
            var properties = ['species','petName', 'sex', 'age'];
            request(server.app)
                .get(buildEndpoint('list', species, {properties: properties}))
                .set('Accept', 'application/json')
                .expect('Content-Type', /json/)
                .expect(function (res) {
                    if (!_.isArray(res.body)) throw new Error(sprintf("list/%s did not return array", species));
                    // if (res.body.length != pageSize) throw new Error(sprintf("list/%s return %s instead of %s pets", species, res.body.length, pageSize));
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
                        if (_.isUndefined(animalProps[propName])) throw new Error(sprintf('(%s/%s) Received undefined value for "%s" (should be %s)', index, numOfPets, propName, expectedValue));

                        var value = animalProps[propName].val;
                        // check if they are equal
                        if (value == expectedValue) return;

                        if (speciesTestModel[propName].valType == 'String') {
                            // if a string check if they match regardless of case, (ie case of species)
                            var testRegex = new RegExp(escapeRegExp(expectedValue), 'i');
                            if (testRegex.test(value)) return;
                        } else if(speciesTestModel[propName].valType == 'Date'){
                            var testDate = new Date(expectedValue),
                                actualDate = new Date(value);

                            if (actualDate.toISOString() == testDate.toISOString()) return;
                        };
                        throw new Error(sprintf('(%s/%s) Received incorrect match for "%s": %s != %s', index, numOfPets, propName, value, expectedValue));
                    });
                })
            }
        }

        _.forEach(speciesTestModel, function (propData, propName) {
            var queryProps = {species: species};

            queryProps[propName] = getRandomOption(propData);

            it("returns only request parameters when 'properties' key provided", function(done){
                var properties = ['species','petName', 'sex', 'age'],
                    queryWithProperties = _.extend({}, queryProps, {properties: properties});
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
                                if (!speciesRegex.test(species)) throw new Error(sprintf("query w/ properties return a pet with incorrect species (%s != %s) at index %s",petData['species'].val, species, index));
                                var numOfProperties = Object.keys(petData).length;
                                if (numOfProperties != expectedNumOfProperties) throw new Error(sprintf("Received incorrect number of properties %s != %s", numOfProperties, expectedNumOfProperties))
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
                queryProps[propName] = getRandomOption(propData);
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
                    randOption = getRandomOption(propData);

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

