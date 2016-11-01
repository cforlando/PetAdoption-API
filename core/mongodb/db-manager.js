var util = require('util'),
    path = require('path'),
    fs = require('fs'),

    _ = require('lodash'),
    async = require('async'),

    Debuggable = require('../lib/debuggable'),
    AnimalDatabase = require('./lib/database/animal'),
    Database = require('./lib/database'),
    config = require('../config'),
    DBError = require('./lib/error'),

    ModelFactory = require('./lib/model-factory'),
    SpeciesModelFactory = require('./lib/species-model-factory'),
    TimestampedModelFactory = require('./lib/timestamped-model-factory'),

    UserSchema = require('./schemas/user'),
    SpeciesListSchema = require('./schemas/species-list');

/**
 * @extends Debuggable
 * @class DatabaseManager
 * @param {Object} [options]
 * @param {String} [options.modelNamePrefix]
 * @param {String} [options.debugTag]
 * @param {DebugLevel} [options.debugLevel]
 * @constructor
 */
function DatabaseManager(options) {
    var self = this;

    /**
     * @var _config
     * @private
     */
    this._config = _.defaults(options, {
        debugLevel: Debuggable.PROD,
        debugTag: 'MongoAPIDatabase: ',
        modelNamePrefix: config.DEVELOPMENT_ENV ? 'dev_' : 'prod_ '
    });

    this.setDebugLevel(this._config.debugLevel);
    this.setDebugTag(this._config.debugTag);

    this.db = {

        user: new Database(
            new ModelFactory(
                self._config.modelNamePrefix + 'users',
                UserSchema,
                _.defaults({
                    debugTag: 'UserModelFactory: ',
                    debugLevel: self.getDebugLevel()
                }, options)
            ), {
                debugTag: 'UserDB: ',
                debugLevel: self.getDebugLevel()
            }),

        speciesList: new Database(
            new TimestampedModelFactory(
                self._config.modelNamePrefix + 'species_list',
                SpeciesListSchema,
                _.defaults({
                    debugTag: 'SpeciesListModelFactory: ',
                    debugLevel: self.getDebugLevel()
                }, options)
            ), {
                debugTag: 'SpeciesListDB: ',
                debugLevel: self.getDebugLevel()
            })
    };

    return this;
}

DatabaseManager.prototype = {

    /**
     *
     * @param {String} configName
     * @param {*} configValue
     */
    setConfig: function (configName, configValue) {
        this._config[configName] = configValue;
    },

    /**
     *
     * @param {String} configName
     * @returns {*}
     */
    getConfig: function (configName) {
        return this._config[configName];
    },

    loadDBImages: function (dbImages, callback) {
        var self = this;

        async.each(dbImages, function each(dbImage, done) {
            var speciesName = dbImage.getSpeciesName(),
                foundSpeciesDB = self.findSpeciesDB(speciesName);

            if (!foundSpeciesDB) {
                self.createSpeciesDatabase(speciesName, function (err, newSpeciesDB) {
                    onSpeciesDBCreated(newSpeciesDB)
                });
            } else {
                onSpeciesDBCreated(foundSpeciesDB)
            }

            function onSpeciesDBCreated(speciesDB) {
                speciesDB.create({
                    name: speciesName,
                    json: JSON.stringify(dbImage.getSpeciesProps())
                }, {
                    complete: function (err, speciesData) {
                        if (err) return done(err);

                        self.createAnimalDatabase(speciesName, function () {
                            self.log(Debuggable.LOW, 'creating animalDB %s', speciesName);

                            // save Animals
                            async.each(dbImage.getAnimals(), function each(animalData, onAnimalSaved) {
                                self.log(Debuggable.LOW, 'saving new %s', speciesName);
                                self.findAnimalDB(speciesName).saveAnimal(animalData, {
                                    complete: function (err) {
                                        onAnimalSaved(err)
                                    }
                                });
                            }, function complete(err) {
                                done(err)
                            });

                        });
                    }
                });
            }

        }, function complete(err) {
            callback(err);
        });


    },


    _getSpeciesDBName: function (speciesName) {
        return speciesName + '-species';
    },


    _getAnimalDBName: function (speciesName) {
        return speciesName + '-animals';
    },


    _getSpeciesModelNamespace: function (speciesName) {
        return this._config.modelNamePrefix + 'species_' + speciesName;
    },


    _getAnimalModelNamespace: function (speciesName) {
        return this._config.modelNamePrefix + 'animal_' + speciesName;
    },


    /**
     *
     * @param {String} speciesName
     * @param {Function} callback
     */
    destroySpeciesDatabase: function (speciesName, callback) {
        var self = this;
        this.findSpeciesDB(speciesName).stop(function (err) {
            if (err){
                callback(err)
            } else {
                delete self.db[self._getSpeciesDBName(speciesName)];
                callback()
            }
        });
    },


    /**
     *
     * @param {Function} callback
     */
    destroyAllSpeciesDatabases: function (callback) {
        var self = this;
        async.eachOf(self.findSpeciesDatabases(), function each(speciesDB, speciesName, done) {
            self.destroySpeciesDatabase(speciesName, done)
        }, function complete(err) {
            callback(err);
        });
    },


    /**
     *
     * @param {String} speciesName
     * @param {Function} callback
     */
    destroyAnimalDatabase: function (speciesName, callback) {
        var self = this,
            animalDatabase = this.findAnimalDB(speciesName);
        if (animalDatabase) {
            animalDatabase.stop(function (err) {
                if (err){
                    callback(err);
                } else{
                    delete self.db[self._getAnimalDBName(speciesName)];
                    callback();
                }
            });
        } else {
            callback();
        }
    },


    /**
     *
     * @param {Function} callback
     */
    destroyAllAnimalDatabases: function (callback) {
        var self = this;
        async.eachOf(self.findAnimalDatabases(), function each(animalDB, speciesName, done) {
            self.destroyAnimalDatabase(speciesName, done)
        }, function complete(err) {
            callback(err);
        });
    },


    /**
     *
     * @param {Function} callback
     */
    createAnimalDatabases: function (callback) {
        var self = this;
        self.log(Debuggable.MED, 'creating animal databases w/ %d species', this.findSpeciesDatabases().length);
        async.eachSeries(this.findSpeciesDatabases(), function each(speciesDB, done) {
            // we have to make a findLatest request here to get the name of the actual species
            // and use that name to create an animal database
            speciesDB.findLatest({
                complete: function (err, speciesData) {
                    if (err) return done(err);
                    if (!speciesData) return done(new Error("No species data was found"));
                    var animalDB = self.findAnimalDB(speciesData.name);
                    if (!animalDB) {
                        self.createAnimalDatabase(speciesData.name, done, {
                            speciesData: speciesData
                        });
                    } else {
                        done();
                    }
                }
            })
        }, function complete(err) {
            callback(err);
        })

    },


    /**
     *
     * @param {Function} callback
     */
    reloadAllSpecies: function (callback) {
        var self = this;
        this.destroyAllAnimalDatabases(function (err) {
            if (err) return callback(err);
            self.createAnimalDatabases(function () {
                callback(err);
            })
        });
    },


    /**
     *
     * @param {String} speciesName
     * @param {Function} callback
     */
    reloadSpecies: function (speciesName, callback) {
        var self = this;
        this.destroyAnimalDatabase(speciesName, function () {
            self.createAnimalDatabase(speciesName, callback);
        });
    },


    /**
     *
     * @param {String} speciesName
     * @param {Function} callback
     */
    createSpeciesDatabase: function (speciesName, callback) {
        this.log(Debuggable.LOW, 'creating speciesDB %s', speciesName);
        var self = this,
            speciesDB = this.findSpeciesDB(speciesName);

        if (speciesDB) {
            callback(null, speciesDB);
        } else {
            var speciesDBNamespace = this._getSpeciesModelNamespace(speciesName),
                speciesModelFactory = new SpeciesModelFactory(speciesDBNamespace, {
                    debugTag: this.format('ModelFactory(%s): ', speciesDBNamespace),
                    debugLevel: this.getDebugLevel()
                });

            this.db[this._getSpeciesDBName(speciesName)] = new Database(speciesModelFactory, {
                debugTag: this.format("Database(%s): ", speciesDBNamespace)
            });

            callback(null, self.findSpeciesDB(speciesName));
        }

    },


    /**
     *
     * @param {String} speciesName
     * @param {Function} callback
     * @param {Object} [options]
     * @param {Object[]} options.speciesData
     */
    createAnimalDatabase: function (speciesName, callback, options) {
        var self = this,
            _options = _.defaults(options, {});
        this.destroyAnimalDatabase(speciesName, function () {
            if (_options.speciesData) {
                var animalNamespace = self._getAnimalModelNamespace(speciesName);
                self.db[self._getAnimalDBName(speciesName)] = new AnimalDatabase(
                    animalNamespace,
                    _options.speciesData.responseFormat, {
                        debugTag: animalNamespace + ': ',
                        debugLevel: self.getDebugLevel()
                    });
                callback();
            } else {
                self.findSpeciesDB(speciesName).findLatest({
                    complete: function (err, speciesProps) {
                        if (err) return callback(err);
                        var animalNamespace = self._getAnimalModelNamespace(speciesName);
                        self.db[self._getAnimalDBName(speciesName)] = new AnimalDatabase(
                            animalNamespace,
                            speciesProps.responseFormat, {
                                debugTag: animalNamespace + ': ',
                                debugLevel: self.getDebugLevel()
                            });
                        callback();
                    }
                })
            }
        });
    },


    findAnimalDatabases: function () {
        return _.filter(this.db, function (db, dbName) {
            return dbName.match(/-animals$/)
        });
    },


    findSpeciesDatabases: function () {
        return _.filter(this.db, function (db, dbName) {
            return dbName.match(/-species$/)
        });
    },

    /**
     *
     * @param {String} identifier
     * @return {Database} identifier
     */
    findDB: function (identifier) {
        return this.db[identifier] || false;
    },

    /**
     *
     * @param {String} speciesName
     * @return {AnimalDatabase} identifier
     */
    findAnimalDB: function (speciesName) {
        return this.db[this._getAnimalDBName(speciesName)] || false;
    },

    /**
     *
     * @param {String} speciesName
     * @return {Database} identifier
     */
    findSpeciesDB: function (speciesName) {
        return this.db[this._getSpeciesDBName(speciesName)] || false;
    },

    stop: function (callback) {
        var self = this;
        async.each(self.db, function each(database, done) {
            database.stop(done);
        }, function complete(err) {
            if (callback) callback(err);
        });
    }

};

_.extend(DatabaseManager.prototype, Debuggable.prototype);

module.exports = DatabaseManager;
