var fs = require('fs'),
    util = require('util'),
    path = require('path'),
    url = require('url'),

    _ = require('lodash'),

    Debuggable = require('../core/lib/debuggable'),
    APIDatabase = require('../core/mongodb'),
    APIDatabaseFormatter = require('../core/server/utils/formatter'),
    Server = require('../core/server'),

    Species = require('../core/lib/species'),
    SpeciesDBImage = require('../core/mongodb/lib/species-db-image');

function Helper() {
    this.opts = {
        printResponses: false
    };
    this.server = null;
    this.testAPIDatabase = null;
    this.dbFormatter = new APIDatabaseFormatter();
    this.testDBImages = this.getTestDBImages();
    this.dbInstanceStack = [];
    this.scopedMethods = [
        'buildAnimalTest',
        'buildEndpoint',
        'buildJasmineRequestCallback',
        'buildDatabase',
        'setupDatabase',
        'buildServer',
        'buildGlobalServer',
        'beforeAPI',
        'afterAPI'
    ];

    var self = this;
    this.scopedMethods.forEach(function (methodName) {
        self[methodName] = self[methodName].bind(self)
    });
};

Helper.prototype = {

    onError: function (err) {
        console.error(err);
        return Promise.resolve();
    },

    getTestDBImages: function () {
        var catProps = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data/props.cat.json')), 'utf8'),
            dogProps = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data/props.dog.json')), 'utf8'),

            // TODO Need better test data
            data = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data/dataset.json')), 'utf8'),
            cats = _.chain(data)
                .filter({species: 'cat'})
                .take(5)
                .value(),
            dogs = _.chain(data)
                .filter({species: 'dog'})
                .take(5)
                .value();

        return [
            new SpeciesDBImage('cat', cats, catProps),
            new SpeciesDBImage('dog', dogs, dogProps)
        ];
    },

    sprintf: util.format,

    dump: function (obj) {
        return util.inspect(obj, {colors: true});
    },

    alterCase: function (str) {
        var randIndex = Math.floor(Math.random() * str.length);
        return str.substr(0, randIndex).toUpperCase() + str.substr(randIndex).toLowerCase();
    },

    /**
     *
     * @param {...String} [path]
     * @param {Object} [options]
     * @param {String|Number} [options.pageSize]
     * @param {String[]} [options.properties]
     * @param {String} [options.base='/api/v1/']
     * @returns {string}
     */
    buildEndpoint: function () {
        var lastArg = Array.prototype.slice.call(arguments, -1)[0],
            options = _.isPlainObject(lastArg) ? lastArg : null,
            opts = _.defaults(options, {
                base: '/api/v1'
            }),
            paths = _.isPlainObject(lastArg) ? Array.prototype.slice.call(arguments, 0, -1) : arguments,

            // iterate through arguments and append paths
            pathname = _.reduce(paths, function (fullpath, partialPath) {
                fullpath = path.join(fullpath.replace(/^\/?/, ''), String(partialPath).replace(/\/+$/, '/'));
                return fullpath;
            }, ''),

            queryProps = _.defaults({}, _.pick(opts, ['pageSize', 'properties']));


        // append formatted query args if provided
        if (Object.keys(queryProps).length) {

            // format properties query arg
            // TODO properties query arg should probably follow some common standard
            if (queryProps.properties) {
                queryProps['properties'] = "['" + opts.properties.join("'\,'") + "']";
            }

            pathname = pathname + url.format({query: queryProps})
        }

        return this.sprintf("%s/%s", opts.base.replace(/\/+$/, ''), pathname);
    },

    buildJasmineRequestCallback: function (done) {
        var self = this;
        return function (err, response) {
            if (err) {
                if (self.opts.printResponses && response) {
                    console.error('response.body: %s', self.dump(response.body));
                }
            }
            done(err)
        }
    },

    isValidID: function (petId) {
        return /^[0-9a-fA-F]{24}$/.test(petId)
    },

    escapeRegExp: function (str) {
        return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
    },

    getRandomOptionValue: function (propData) {
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
        if (result === null || result === undefined) throw new Error(this.sprintf("Cannot generate test option for '%j'", propData.key || propData));
        return result;
    },

    /**
     *
     * @param queryProps
     * @param speciesProps
     * @returns {Function}
     */
    buildAnimalTest: function (queryProps, speciesProps) {

        var self = this;

        return function (res) {

            if (!_.isArray(res.body)) {

                throw new Error(this.sprintf("received %s instead of an array", typeof res.body));

            } else if (res.body.length) {

                // define a species with speciesProps to be used for verification of prop types
                var testSpeciesProp = _.find(speciesProps, {key: 'species'}),
                    testSpecies = new Species(testSpeciesProp.val || 'testSpecies', speciesProps);

                // responses should always be an array
                _.forEach(res.body, function (animalData, index) {

                    // match queryProps on animalData
                    _.forEach(queryProps, function (expectedValue, propName) {

                        // for each prop in the query
                        // first, check if property exists
                        if (_.isUndefined(animalData[propName])) {
                            var errTxt = self.sprintf('(%s/%s) Received undefined actualValue for "%s" (should be %s)', index, res.body.length, propName, expectedValue);
                            throw new Error(errTxt);
                        }
                        var actualValue = animalData[propName].val,
                            speciesProp = testSpecies.getProp(propName);

                        if (speciesProp.valType === 'String') {

                            // if a string, check if they match regardless of case, (ie case of species)
                            var testRegex = new RegExp(self.escapeRegExp(expectedValue), 'i');
                            if (testRegex.test(actualValue)) return;

                        } else if (speciesProp.valType === 'Date') {

                            // if a date,  convert to date and back to iso strings for comparison
                            var testDate = new Date(expectedValue),
                                actualDate = new Date(actualValue);
                            if (actualDate.toISOString() === testDate.toISOString()) return;

                        } else if (speciesProp.valType == 'Boolean') {

                            var expectedBoolValue = (expectedValue === true || /y|yes/i.test(expectedValue));
                            if (actualValue === expectedBoolValue) return; // all is well this property

                        } else if (actualValue == expectedValue) {
                            // general comparison if the values are equal without any sanitization
                            return;

                        } else if (expectedValue.length) {
                            // make general comparison of each value in expected array

                            expectedValue.forEach(function (val, index) {
                                if (actualValue[index] != val) throw new Error("");
                            });
                            // expected and actual values are equal
                            return;
                        }

                        // all successful returns of expected results should have been caught
                        // Anything else is incorrect
                        var errText = self.sprintf('(%s/%s) Received incorrect match for "%s"', index, res.body.length, propName);
                        throw new Error(errText);
                    });
                })
            } else {
                // throw new Error(self.sprintf("No pets returned for: %s", self.dump(queryProps)));
                throw new Error(self.sprintf("No pets returned"));
            }
        }
    },

    buildDatabase: function (options) {
        return Promise.resolve(
            new APIDatabase(
                _.defaults(options, {
                    debugLevel: Debuggable.PROD,
                    preset: [],
                    collectionNamePrefix: 'test_api_'
                })
            )
        );
    },

    setupDatabase: function (testDB, options) {

        var self = this,
            opts = _.defaults(options, {
                testDBImages: self.testDBImages
            });

        return testDB.uploadDBImages(opts.testDBImages)
            .then(function () {
                return new Promise(function(resolve, reject){
                    self.dbFormatter.formatDB(testDB, {
                        createMissingFields: true,
                        populateEmptyFields: true,
                        complete: function (err) {
                            if (err) return reject(err);
                            resolve(testDB);
                        }
                    });
                })
            })
    },

    buildServer: function (database) {
        var self = this;
        return new Promise(function (resolve, reject) {

            if (!database) {
                self.buildDatabase()
                    .then(function (newTestDB) {
                        var server = new Server(newTestDB, {debugLevel: Debuggable.PROD});
                        resolve(server);
                    })
                    .catch(this.onError)
            } else {

                // pass formatted database to server
                var server = new Server(database, {debugLevel: Debuggable.PROD});
                resolve(server);
            }
        });

    },

    buildGlobalServer: function () {
        var self = this;
        if (this.server) return Promise.resolve(this.server);
        if (this.init) return this.init;

        this.init = this.buildDatabase()
            .then(this.setupDatabase)
            .then(function (database) {
                self.database = database;
                return Promise.resolve(self.database);
            })
            .then(this.buildServer)
            .then(function (server) {
                self.server = server;
                return Promise.resolve(self.server);
            })
            .catch(this.onError);

        return this.init;
    },

    beforeAPI: function (options) {
        var self = this,
            opts = _.defaults(options, {
                server: null,
                database: null
            });

        if (!opts.database) {

            return this.buildDatabase()
                .then(this.setupDatabase)
                .then(function (database) {
                    opts.database = database;
                    self.dbInstanceStack.push(database);
                    return Promise.resolve(opts.database)
                })
                .then(this.buildServer)
                .then(function (server) {
                    return Promise.resolve({server: server, database: opts.database})
                })
                .catch(this.onError);

        } else if (!opts.server) {

            return this.setupDatabase(opts.database)
                .then(this.buildServer)
                .then(function (server) {
                    return Promise.resolve({server: server, database: opts.database})
                })
                .catch(this.onError);

        } else {

            return this.setupDatabase(opts.database)
                .then(function () {
                    return Promise.resolve({server: opts.server, database: opts.database})
                })
                .catch(this.onError);
        }

    },

    afterAPI: function (testAPIDatabase) {
        var self = this;

        return new Promise(function (resolve, reject) {
            var db;

            if (db = testAPIDatabase || self.dbInstanceStack.pop() || self.database) {
                db.clearAnimals(function (err) {
                    if (err) return reject(err);

                    db.stop().then(resolve, reject);
                });
            } else {
                reject(new Error('no db to test on'));
            }

        })
    }
};

Helper._global = new Helper();
module.exports = Helper;
