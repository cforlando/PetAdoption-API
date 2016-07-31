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
    speciesList = ['dog'];


function pickRandomOption(propData) {
    var options = propData.options,
        result = false;
    if (options && options.length > 0) {
        var randOptionIndex = Math.floor(Math.random() * options.length);
        result = options[randOptionIndex]
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
 * @param operation
 * @param [species]
 * @param [options]
 * @param [options.value]
 * @param [options.pageSize]
 * @param [options.page]
 */
function buildEndpoint(operation, species, options) {
    var base = 'api/v1/',
        endpoint = '';
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
            return;
    }

    if (species) endpoint = path.join(endpoint,  '/' + species);


    if (options) {
        if (options.value) {
            endpoint = path.join(endpoint, '/' + options.value.toString());
        }
        if (options.page) {
            endpoint = path.join(endpoint, '/' + options.page.toString());
        }
        if (options.pageSize) {
            endpoint += util.format("?pageSize=%s", options.pageSize);
        }
    }

    return endpoint;
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

describe("Test functions", function (){
    describe("buildEndpoint", function () {

        it("returns correct values", function () {
            expect(buildEndpoint('model', 'dog')).toMatch("api/v1/model/dog");
            expect(buildEndpoint('query')).toMatch(/^api\/v1\/query\/?$/);
            expect(buildEndpoint('list', 'dog')).toMatch(/^api\/v1\/list\/dog\/?$/);
            expect(buildEndpoint('list', 'dog', {pageSize: 5})).toMatch(/^api\/v1\/list\/dog\?pageSize=5$/);
            expect(buildEndpoint('list', 'dog', {page: 2, pageSize: 5})).toMatch(/^api\/v1\/list\/dog\/2\?pageSize=5$/);
        })
    })
});

_.forEach(speciesList, function (species) {

    describe(sprintf("GET options/%s/", species), function () {

        it(sprintf("returns a JSON array of all options for %s species", species), function (done) {

            request(server.app)
                .get(buildEndpoint('option', species))
                .set('Accept', 'application/json')
                .expect('Content-Type', /json/)
                .expect(200, optionsData[species], buildJasmineCallback(done))
        });

        describe(":optionName/", function () {

            _.forEach(optionsData[species], function (optionList, optionName) {

                it(sprintf("returns JSON array of options for %s", optionName), function (done) {

                    request(server.app)
                        .get(buildEndpoint('option', species, {value: optionName}))
                        .set('Accept', 'application/json')
                        .expect('Content-Type', /json/)
                        // .expect(optionsData[species][optionName])
                        // .expect(function (res) {
                        //     if (!!res.body) throw new Error(special("options/%s/%s did not return a valid object", species, optionName));
                        //     if (!_.isArray(res.body)) throw new Error(special("option/%s/%s did not return array", species, optionName));
                        // })
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

        it(sprintf("returns a paged JSON of all %s", species), function (done) {
            var pageSize = 10;

            request(server.app)
                .get(buildEndpoint('list', species, {pageSize: pageSize}))
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
    });

    describe("POST query/", function () {


        function buildPropsTest(queryProps) {
            return function (res) {
                if (!_.isArray(res.body)) throw new Error(sprintf("received %s instead of an array", typeof res.body));
                if (res.body.length == 0) return;
                _.forEach(queryProps, function (propValue, propName) {
                    if (res.body[propName].val != queryProps[propName]) throw new Error('Received incorrect pet when species provided');
                });
            }
        }

        _.forEach(modelsData[species], function (propData, propName) {
            var queryProps = {};
            queryProps[propName] = pickRandomOption(propData);

            it(sprintf("returns JSON of all pets with provided %s prop", propName), function (done) {
                request(server.app)
                    .post(buildEndpoint('query'))
                    .send(queryProps)
                    .set('Accept', 'application/json')
                    .expect(buildPropsTest(queryProps))
                    .expect(200, buildJasmineCallback(done))
            })
        });

        describe("when multiple params are provided", function () {
            var queryProps = {};

            _.forEach(modelsData[species], function (propData, propName) {

                queryProps[propName] = pickRandomOption(propData);

                it(sprintf("returns JSON of all pets with provided '%s' props", Object.keys(queryProps).join(", ")), function (done) {
                    request(server.app)
                        .post(buildEndpoint('query'))
                        .send(queryProps)
                        .set('Accept', 'application/json')
                        .expect(buildPropsTest(queryProps))
                        .expect(200, buildJasmineCallback(done))
                })

            })
        });

        describe("when ignoreCase flag is set", function () {
            _.forEach(modelsData[species], function (propData, propName) {
                var queryProps = {ignoreCase: [propName]},
                    randOption = pickRandomOption(propData);

                //skip non-string values
                if (!_.isString(randOption)) return;

                queryProps[propName] = alterCase(randOption);
                it(sprintf("returns JSON of all pets with provided '%s' prop regardless of Case", propName), function (done) {
                    request(server.app)
                        .post(buildEndpoint('query'))
                        .send(queryProps)
                        .set('Accept', 'application/json')
                        .expect(buildPropsTest(queryProps))
                        .expect(200, buildJasmineCallback(done))
                })

            })
        });
    });

});

