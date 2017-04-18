var fs = require('fs');
var util = require('util');
var path = require('path');
var url = require('url');

var _ = require('lodash');
var chai = require('chai');

var Debuggable = require('../core/lib/debuggable');
var APIDatabase = require('../core/mongodb');
var APIDatabaseFormatter = require('../core/server/utils/formatter');
var SpeciesDbImage = require('../core/mongodb/lib/species-db-image');
var Server = require('../core/server');
var Species = require('../core/lib/species');

var expect = chai.expect;

function Helper() {
    this.opts = {
        printResponses: false
    };
    this.server = null;
    this.dbFormatter = new APIDatabaseFormatter();
    this.testDbImages = this.getTestDbImages();
    this.dbInstanceStack = [];
};

Helper.prototype = {

    onError: function (err) {
        console.error(err);
        return Promise.resolve();
    },

    getTestDbImages: function () {
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
            new SpeciesDbImage('cat', cats, catProps),
            new SpeciesDbImage('dog', dogs, dogProps)
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
                if (!_.isNumber(result)) {
                    // TODO implement better handling of invalid number type options
                    console.warn('found invalid number option for "%s"(%s)', propData.key, propData.valType)
                    result = -1;
                    break;
                }

                result = parseFloat(result);
                break;
            case 'Date':
                var today = new Date(result);
                result = today.toISOString();
                break;
            default:
        }

        if (result === null || result === undefined) {
            throw new Error(this.sprintf("Cannot generate test option for '%j'", propData.key || propData));
        }

        return result;
    },

    /**
     *
     * @param queryProps
     * @param speciesProps
     * @returns {Function}
     */
    buildAnimalTest: function (queryProps, speciesProps) {
        // define a species with speciesProps to be used for verification of prop types
        var testSpeciesProp = _.find(speciesProps, {key: 'species'});
        var testSpecies = new Species(testSpeciesProp.val || 'testSpecies', speciesProps);
        var self = this;

        return function (res) {
            expect(res.body).to.be.an('Array');

            if (res.body.length === 0) {
                throw new Error(self.sprintf("No pets returned"));
            }

            // responses should always be an array
            _.forEach(res.body, function (animalData, index) {

                // match queryProps on animalData
                _.forEach(queryProps, function (expectedValue, propName) {
                    // for each prop in the query
                    var actualValue;
                    var speciesProp;

                    // first, check if property exists
                    expect(animalData[propName]).to.exist;
                    actualValue = animalData[propName].val;
                    speciesProp = testSpecies.getProp(propName);

                    switch (speciesProp.valType) {
                        case 'String':
                            // if a string, check if they match regardless of case, (ie case of species)
                            var testRegex = new RegExp(self.escapeRegExp(expectedValue), 'i');

                            expect(actualValue).to.match(testRegex);
                            break;

                        case 'Date':
                            expect(new Date(actualValue)).to.eql(new Date(expectedValue));
                            break;

                        case 'Boolean':
                            var expectedBoolValue = (expectedValue === true || /y|yes/i.test(expectedValue));

                            expect(actualValue).to.eql(expectedBoolValue);
                            break;

                        default:
                            // general comparison if the values are equal without any sanitization
                            if (expectedValue.length) {
                                expect(actualValue).to.have.members(expectedValue);
                            } else {
                                expect(actualValue).to.eql(expectedValue);
                            }
                    }

                });
            })
        }
    },

    /**
     *
     * @param options
     * @return {Promise<MongoAPIDatabase>}
     */
    buildDatabase: function (options) {
        var dbDefaults = {
            debugLevel: Debuggable.PROD,
            preset: [],
            collectionNamePrefix: 'test_api_'
        };
        var dbOptions = _.defaults(options, dbDefaults);

        return Promise.resolve(new APIDatabase(dbOptions));
    },

    /**
     *
     * @param {MongoAPIDatabase} testDb
     * @param {Object} [options]
     * @param {SpeciesDbImage[]} [options.testDbImages]
     * @returns {Promise}
     */
    setupDatabase: function (testDb, options) {
        var self = this;
        var opts = _.defaults(options, {
            testDbImages: self.testDbImages
        });
        var formatOptions = {
            createMissingFields: true,
            populateEmptyFields: true
        };

        return testDb.uploadDbImages(opts.testDbImages)
            .then(function () {
                return self.dbFormatter.formatDb(testDb, formatOptions);
            })
            .then(function () {
                return Promise.resolve(testDb);
            })
    },

    /**
     *
     * @param database
     * @return {Promise<Server>}
     */
    buildServer: function (database) {
        var self = this;
        var server;

        if (!database) {
            return self.buildDatabase()
                .then(function (newTestDb) {
                    var server = new Server(newTestDb, {debugLevel: Debuggable.PROD});
                    return Promise.resolve(server);
                })
                .catch(function (err) {
                    return self.onError(err);
                })
        }

        // pass formatted database to server
        server = new Server(database, {debugLevel: Debuggable.PROD});

        return Promise.resolve(server);
    },

    /**
     *
     * @return {Promise}
     */
    buildGlobalServer: function () {
        var self = this;
        if (this.server) return Promise.resolve(this.server);
        // ensure we actually only init once
        if (this.init) return this.init;

        this.init = this.buildDatabase()
            .then(function (database) {
                return self.setupDatabase(database)
            })
            .then(function (database) {
                self.database = database;
                return self.buildServer(database)
            })
            .then(function (server) {
                self.server = server;
                return Promise.resolve(self.server);
            })
            .catch(function (err) {
                return self.onError(err)
            });

        return this.init;
    },

    /**
     *
     * @param options
     * @returns {Promise}
     */
    beforeAPI: function (options) {
        var self = this;
        var opts = _.defaults(options, {
            server: null,
            database: null
        });

        if (!opts.database) {

            return this.buildDatabase()
                .then(function (database) {
                    return self.setupDatabase(database)
                })
                .then(function (database) {
                    opts.database = database;
                    self.dbInstanceStack.push(database);
                    return self.buildServer(opts.database)
                })
                .then(function (server) {
                    return Promise.resolve({server: server, database: opts.database})
                })
                .catch(function (err) {
                    return self.onError(err)
                });
        }

        if (!opts.server) {

            return this.setupDatabase(opts.database)
                .then(function (database) {
                    opts.database = database;
                    return self.buildServer(opts.database);
                })
                .then(function (server) {
                    return Promise.resolve({server: server, database: opts.database})
                })
                .catch(function (err) {
                    return self.onError(err)
                });
        }

        return this.setupDatabase(opts.database)
            .then(function () {
                return Promise.resolve({server: opts.server, database: opts.database})
            })
            .catch(function (err) {
                return self.onError(err)
            });

    },

    /**
     *
     * @param testAPIDatabase
     * @returns {Promise}
     */
    afterAPI: function (testAPIDatabase) {
        var self = this;
        var db = testAPIDatabase || self.dbInstanceStack.pop() || self.database;

        if (!db) {
            return Promise.reject(new Error('no db to test on'));
        }

        return db.clearAnimals()
            .then(function () {
                return db.stop()
            })
            .catch(function (err) {
                console.error(err);
                return Promise.reject(err);
            });
    }
};

Helper._global = new Helper();
module.exports = Helper;
