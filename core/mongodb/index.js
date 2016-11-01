var util = require('util'),
    path = require('path'),
    fs = require('fs'),

    _ = require('lodash'),
    async = require('async'),

    Debuggable = require('../lib/debuggable/index'),
    SpeciesDBImage = require('./lib/species-db-image'),
    config = require('../config'),
    DBError = require('./lib/error'),

    DBManager = require('./db-manager');


/**
 *
 * @extends Debuggable
 * @class MongoAPIDatabase
 * @param {Object} [options]
 * @param {Function} [options.onInitialized]
 * @param {String} [options.modelNamePrefix]
 * @param {Boolean} [options.forcePreset]
 * @param {SpeciesDBImage[]} [options.preset]
 * @returns {MongoAPIDatabase}
 * @constructor
 */
function MongoAPIDatabase(options) {
    var self = this,
        _options = _.defaults(options, {
            debugLevel: Debuggable.PROD,
            debugTag: 'MongoAPIDatabase: ',
            modelNamePrefix: config.DEVELOPMENT_ENV ? 'dev_' : 'prod_ ',
            preset: [new SpeciesDBImage('cat', [], (function () {
                try {
                    return JSON.parse(fs.readFileSync(path.join(process.cwd(), './data/props.cat.json'), 'utf8'));
                } catch (err) {
                    self.error(err);
                    return {};
                }
            })()), new SpeciesDBImage('dog', [], (function () {
                try {
                    return JSON.parse(fs.readFileSync(path.join(process.cwd(), './data/props.dog.json'), 'utf8'));
                } catch (err) {
                    self.error(err);
                    return {};
                }
            })())]
        });

    this.setDebugLevel(_options.debugLevel);
    this.setDebugTag(_options.debugTag);

    this.manager = new DBManager({
        debugLevel: this.getDebugLevel(),
        modelNamePrefix: _options.modelNamePrefix
    });

    this.log(Debuggable.LOW, 'Running in %s mode.', (config.DEVELOPMENT_ENV) ? 'dev' : 'prod');

    this.getSpeciesList({
        complete: function (err, speciesList) {
            if (err || speciesList.length == 0 || _options.forcePreset) {
                if (err) self.error(err);
                self.manager.loadDBImages(_options.preset, function () {
                    self.saveSpeciesList({
                        complete: function (err) {
                            if (err) self.error(err);
                            self.log(Debuggable.LOW, 'ready');
                            if (_options.onInitialized) _options.onInitialized();
                        }
                    })
                });
            } else {
                async.each(speciesList, function each(speciesName, done) {
                    self.manager.createSpeciesDatabase(speciesName, function (err, speciesDB) {
                        done(err);
                    });
                }, function complete(err) {
                    if (err) self.error(err);
                    self.manager.createAnimalDatabases(function () {
                        self.saveSpeciesList({
                            complete: function (err) {
                                if (err) self.error(err);
                                self.log(Debuggable.LOW, 'ready');
                                if (_options.onInitialized) _options.onInitialized();
                            }
                        })
                    })
                });
            }
        }
    });

    return this;
}

MongoAPIDatabase.prototype = {

    /**
     *
     * @param [options]
     * @param [options.complete]
     */
    saveSpeciesList: function (options) {
        var self = this,
            _options = _.defaults(options, {}),
            speciesList = [];


        async.each(this.manager.findSpeciesDatabases(), function each(speciesDB, done) {
            speciesDB.findLatest({
                complete: function (err, speciesData) {
                    if (err) return done(err);
                    if (!speciesData) return done(new Error("Species data missing"));
                    speciesList.push(speciesData.name);
                    done();
                }
            })
        }, function complete() {
            self.manager.findDB('speciesList').create({speciesList: speciesList}, {
                complete: function (err, latestSpeciesList) {
                    if (err) {
                        if (_options.complete) _options.complete(err);
                    } else {
                        if (_options.complete) _options.complete(null, latestSpeciesList);
                    }
                }
            });
        });
    },


    /**
     *
     * @param [options]
     * @param [options.complete]
     */
    getSpeciesList: function (options) {
        var _options = _.defaults(options, {});

        this.manager.findDB('speciesList').findLatest({
            complete: function (err, result) {
                if (_options.complete) _options.complete(err, result && result.speciesList ? result.speciesList : []);
            }
        })
    },


    /**
     *
     * @param {Object} userData
     * @param {Object} [options]
     * @param {Function} [options.complete]
     */
    findUser: function (userData, options) {
        var _options = _.defaults(options, {});
        this.manager.findDB('user').findOne(userData, _options);
    },


    /**
     *
     * @param {Object} userData
     * @param {Object} [options]
     * @param {Function} [options.complete]
     */
    saveUser: function (userData, options) {
        var _options = _.defaults(options, {});
        this.manager.findDB('user').update({id: userData.id}, userData, _options);
    },


    /**
     *
     * @param {String} speciesName
     * @param {Object} [options]
     * @param {Function} [options.complete]
     */
    findSpecies: function (speciesName, options) {
        var self = this,
            speciesDB = this.manager.findSpeciesDB(speciesName),
            _options = _.defaults(options, {});
        if (speciesDB) {
            speciesDB.findLatest(_.defaults({
                complete: function (err, speciesProps) {
                    if (_options.complete) _options.complete(null, speciesProps.responseFormat)
                }
            }, _options));
        } else {
            self.error('invalid find species request: %s', speciesName);
            if (_options.complete) _options.complete(new DBError.Species())
        }
    },


    /**
     *
     * @param {String} speciesName
     * @param {Object} props
     * @param {Object} [options]
     * @param {Function} [options.complete]
     */
    createSpecies: function (speciesName, props, options) {
        var self = this,
            _options = _.defaults(options, {});

        this.manager.createSpeciesDatabase(speciesName, function (createSpeciesDBErr, speciesDatabase) {
            if (createSpeciesDBErr) {
                if (_options.complete) _options.complete(createSpeciesDBErr);
                return;
            }
            speciesDatabase.create({
                name: speciesName,
                json: JSON.stringify(props)
            }, {
                complete: function (createSpeciesErr) {
                    if (createSpeciesErr) {
                        if (_options.complete) _options.complete(createSpeciesErr);
                        return;
                    }
                    self.manager.createAnimalDatabase(speciesName, function (createAnimalDBErr) {
                        if (createAnimalDBErr) {
                            if (_options.complete) _options.complete(createAnimalDBErr);
                            return;
                        }
                        self.saveSpeciesList({
                            complete: function (saveSpeciesListErr) {
                                if (saveSpeciesListErr) {
                                    if (_options.complete) _options.complete(saveSpeciesListErr);
                                    return;
                                }
                                _options.complete(null, props);
                            }
                        })
                    });

                }
            })
        });
    },


    /**
     *
     * @param {String} speciesName
     * @param {Object} props
     * @param {Object} [options]
     * @param {Function} [options.complete]
     */
    saveSpecies: function (speciesName, props, options) {
        var self = this,
            speciesDB = this.manager.findSpeciesDB(speciesName),
            _options = _.defaults(options, {});

        if (speciesDB) {
            speciesDB.create({
                name: speciesName,
                json: JSON.stringify(props)
            }, {
                complete: function (err, speciesData) {
                    if (err) {
                        if (_options.complete) _options.complete(err)
                    } else {
                        self.manager.reloadSpecies(speciesName, function () {
                            if (_options.complete) _options.complete(null, speciesData.responseFormat)
                        })
                    }
                }
            });
        } else {
            self.error('invalid save species request: %s', speciesName);
            if (_options.complete) _options.complete(new DBError.Species())
        }
    },


    /**
     *
     * @param {String} speciesName
     * @param {Object} props
     * @param {Object} [options]
     * @param {Function} [options.complete]
     */
    deleteSpecies: function (speciesName, options) {
        var self = this,
            speciesDB = this.manager.findSpeciesDB(speciesName),
            _options = _.defaults(options, {});

        if (speciesDB) {
            this.manager.destroyAnimalDatabase(speciesName, function (err) {
                if (err) {
                    if (_options.complete) _options.complete(err);
                } else {
                    self.manager.destroySpeciesDatabase(speciesName, function (err) {
                        if (err) {
                            if (_options.complete) _options.complete(err);
                        } else {
                            self.saveSpeciesList({
                                complete: function (err) {
                                    if (err) {
                                        if (_options.complete) _options.complete(err);
                                    } else {
                                        if (_options.complete) _options.complete(null, true);
                                    }
                                }
                            });
                        }
                    });
                }
            });
        } else {
            this.error('invalid save species request: %s', speciesName);
            if (_options.complete) _options.complete(new DBError.Species());
        }
    },


    /**
     *
     * @param {String} speciesName
     * @param {Object} props
     * @param {Object} [options]
     * @param {Function} [options.complete]
     */
    removeAnimal: function (speciesName, props, options) {
        var self = this,
            animalDB = this.manager.findAnimalDB(speciesName),
            _options = _.defaults(options, {});
        if (animalDB) {
            animalDB.removeAnimal(props, _options);
        } else {
            self.error('invalid remove animal species request: %s', speciesName);
            if (_options.complete) _options.complete(new DBError.Species())
        }
    },


    /**
     *
     * @param {String} speciesName
     * @param {Object} props
     * @param {Object} [options]
     * @param {Function} [options.complete]
     */
    saveAnimal: function (speciesName, props, options) {
        var self = this,
            animalDB = this.manager.findAnimalDB(speciesName),
            _options = _.defaults(options, {});
        if (animalDB) {
            animalDB.saveAnimal(props, _options);
        } else {
            self.error('invalid save animal species request: %s', speciesName);
            if (_options.complete) _options.complete(new DBError.Species())
        }
    },


    /**
     *
     * @param {Object} props
     * @param {Object} [options]
     * @param {Boolean} [options.isV1Format=true]
     * @param {Function} [options.complete]
     */
    findAnimals: function (props, options) {
        var self = this,
            result = [],
            _options = _.defaults(options, {}),
            speciesName = props.species;

        if (speciesName) {
            var animalDB = this.manager.findAnimalDB(speciesName);
            if (animalDB) {
                animalDB.findAnimals(props, _options);
            } else {
                if (_options.complete) _options.complete(null, result);
            }
        } else {
            // search all animal databases

            async.each(self.manager.findAnimalDatabases(), function (database, done) {
                database.findAnimals(props, {
                    complete: function (err, animals) {
                        if (err) {
                            done(err)
                        } else {
                            result = result.concat(animals);
                            done();
                        }
                    }
                });
            }, function complete(err) {
                if (_options.complete) _options.complete(err, result)
            });
        }
    },

    stop: function (callback) {
        this.manager.stop(callback);
    }

};

_.extend(MongoAPIDatabase.prototype, Debuggable.prototype);

module.exports = MongoAPIDatabase;
