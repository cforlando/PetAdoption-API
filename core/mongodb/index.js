var util = require('util'),
    path = require('path'),
    fs = require('fs'),

    _ = require('lodash'),
    async = require('async'),

    config = require('../config'),
    Debuggable = require('../lib/debuggable'),
    Animal = require('../lib/animal'),
    Species = require('../lib/species'),

    DBError = require('./lib/error'),
    SpeciesDBImage = require('./lib/species-db-image'),
    UserDatabase = require('./user'),
    SpeciesCollectionDatabase = require('./species-collection'),
    AnimalDatabase = require('./animal');


/**
 *
 * @extends Debuggable
 * @class MongoAPIDatabase
 * @param {Object} [options]
 * @param {Function} [options.onInitialized]
 * @param {String} [options.modelNamePrefix]
 * @param {SpeciesDBImage[]} [options.preset]
 * @param {Function} [options.onPresetComplete]
 * @returns {MongoAPIDatabase}
 * @constructor
 */
function MongoAPIDatabase(options) {
    var self = this,
        _options = _.defaults(options, {
            debugLevel: Debuggable.PROD,
            debugTag: 'MongoAPIDatabase: ',
            modelNamePrefix: config.DEVELOPMENT_ENV ? 'dev_' : 'prod_ ',
            preset: (function () {

                var catProps = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data/props.cat.json')), 'utf8'),
                    dogProps = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data/props.dog.json')), 'utf8'),

                    // TODO Need better test data
                    data = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data/dataset.json')), 'utf8'),

                    cats = _.chain(data)
                        .filter({species: 'cat'})
                        .value(),
                    dogs = _.chain(data)
                        .filter({species: 'dog'})
                        .value();

                return [
                    new SpeciesDBImage('cat', cats, catProps),
                    new SpeciesDBImage('dog', dogs, dogProps)
                ];
            })()
        });

    this.setDebugLevel(_options.debugLevel);
    this.setDebugTag(_options.debugTag);

    this.log(Debuggable.LOW, 'Running in %s mode.', (config.DEVELOPMENT_ENV) ? 'dev' : 'prod');

    this.UserDB = new UserDatabase({modelNamePrefix: _options.modelNamePrefix});
    this.SpeciesCollectionDB = new SpeciesCollectionDatabase({modelNamePrefix: _options.modelNamePrefix});
    this.AnimalDB = new AnimalDatabase({modelNamePrefix: _options.modelNamePrefix});
    this.speciesCache = {};

    if (_options.preset && _options.preset.length > 0) this.uploadDBImages(_options.preset, _options.onPresetComplete);

    return this;
}

MongoAPIDatabase.prototype = {

    _setSpeciesCacheFromCollection: function (speciesCollectionDoc) {
        this.speciesCache = _.reduce(speciesCollectionDoc.speciesList, function (collection, speciesData) {
            collection[speciesData.name] = new Species(speciesData.name, speciesData.props);
            return collection;
        }, {});
    },


    /**
     *
     * @param {SpeciesDBImage[]} speciesDBImages
     * @param {Function} [onSetComplete]
     */
    uploadDBImages: function (speciesDBImages, onSetComplete) {
        var self = this;
        async.eachSeries(speciesDBImages,
            function each(dbImage, done) {

                self.saveSpecies(dbImage.getSpeciesName(), dbImage.getSpeciesProps(), {
                    complete: function () {
                        async.eachSeries(dbImage.getAnimals(),
                            function each(animalData, onAnimalSaved) {
                                self.saveAnimal(dbImage.getSpeciesName(), animalData, {
                                    complete: function (err) {
                                        onAnimalSaved(err)
                                    }
                                })
                            },
                            function (err) {
                                done(err);
                            }
                        );
                    }
                })
            },
            function complete(err) {
                if (onSetComplete) onSetComplete(err);
            })
    },
    /**
     *
     * @param [options]
     * @param [options.complete]
     */
    getSpeciesList: function (options) {
        var _options = _.defaults(options, {});

        this.SpeciesCollectionDB.findLatest({
            complete: function (err, latestSpeciesCollection) {
                var speciesList = [];
                if (latestSpeciesCollection) {
                    speciesList = latestSpeciesCollection.speciesList.map(function (speciesDoc) {
                        return speciesDoc.name;
                    });
                }

                if (_options.complete) _options.complete(err, speciesList);
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
        this.UserDB.findOne(userData, _options);
    },


    /**
     *
     * @param {Object} userData
     * @param {Object} [options]
     * @param {Function} [options.complete]
     */
    saveUser: function (userData, options) {
        var _options = _.defaults(options, {});
        this.UserDB.update({id: userData.id}, userData, _options);
    },


    /**
     *
     * @param {String} speciesName
     * @param {Object} [options]
     * @param {Function} [options.complete]
     */
    findSpecies: function (speciesName, options) {
        var self = this,
            _options = _.defaults(options, {});
        this.SpeciesCollectionDB.findLatest({
            complete: function (err, speciesCollectionDoc) {
                if (err) {
                    if (_options.complete) _options.complete(err)
                } else {
                    self._setSpeciesCacheFromCollection(speciesCollectionDoc);
                    var speciesDoc = _.find(speciesCollectionDoc.speciesList, {name: speciesName.toLocaleLowerCase()});
                    if (speciesDoc) {
                        if (_options.complete) _options.complete(null, speciesDoc)
                    } else {
                        self.error('invalid find species request: %s', speciesName);
                        if (_options.complete) _options.complete(new DBError.Species())
                    }
                }
            }
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
            _options = _.defaults(options, {}),
            species = new Species(speciesName, props);


        this.SpeciesCollectionDB.findLatest({
            complete: function (err, speciesCollectionDoc) {
                if (err) {
                    // if (_options.complete) _options.complete(err);
                    // return;
                    console.error(err);
                }

                speciesCollectionDoc = speciesCollectionDoc || {speciesList: []};

                var speciesDoc = _.find(speciesCollectionDoc.speciesList, {name: species.getSpeciesName()}),
                    newSpeciesDoc = species.toMongooseDoc();

                if (speciesDoc) {
                    // update referenced species doc in collection
                    // TODO verify this overwrites speciesCollectionDoc
                    speciesDoc = newSpeciesDoc;
                } else {
                    // add new species doc
                    speciesCollectionDoc.speciesList.push(newSpeciesDoc);
                }

                var newSpeciesCollectionDoc = _.chain(speciesCollectionDoc)
                    .omit(['_id', '__v'])
                    .set('speciesList', _.uniqBy(speciesCollectionDoc.speciesList, 'name'))
                    .value();

                self._setSpeciesCacheFromCollection(newSpeciesCollectionDoc);
                // save updated species collection
                self.SpeciesCollectionDB.create(newSpeciesCollectionDoc, {
                    complete: function (err, newSpeciesCollection) {
                        if (_options.complete) _options.complete(err, newSpeciesDoc)
                    }
                });
            }
        })
    },


    /**
     *
     * @param {String} speciesName
     * @param {Object} [options]
     * @param {Function} [options.complete]
     */
    deleteSpecies: function (speciesName, options) {

        var self = this,
            _options = _.defaults(options, {});


        this.SpeciesCollectionDB.findLatest({
            complete: function (err, speciesCollectionDoc) {
                var newSpeciesCollectionDoc = _.chain(speciesCollectionDoc)
                    .omit(['_id', '__v'])
                    .set('speciesList', _.reject(speciesCollectionDoc.speciesList, {name: speciesName}))
                    .value();

                self.SpeciesCollectionDB.create(newSpeciesCollectionDoc, {
                    complete: function (err, result) {
                        if (_options.complete) _options.complete(err, !err)
                    }
                });
            }
        });
    },


    /**
     *
     * @param {String} speciesName
     * @param {Object} props
     * @param {Object} [options]
     * @param {Function} [options.complete]
     */
    removeAnimal: function (speciesName, props, options) {
        var _options = _.defaults(options, {}),
            animal = new Animal(this.speciesCache[speciesName], props);
        this.AnimalDB.removeAnimal(animal, _options);
    },


    /**
     *
     * @param {String} speciesName
     * @param {Object} props
     * @param {Object} [options]
     * @param {Function} [options.complete]
     */
    saveAnimal: function (speciesName, props, options) {
        var _options = _.defaults(options, {}),
            animal = new Animal(this.speciesCache[speciesName], props);
        this.AnimalDB.saveAnimal(animal, _options);
    },


    /**
     *
     * @param {Object} props
     * @param {Object} [options]
     * @param {Boolean} [options.isV1Format=true]
     * @param {Function} [options.complete]
     */
    findAnimals: function (props, options) {
        var _options = _.defaults(options, {});
        this.AnimalDB.findAnimals(props, _options);
    },

    /**
     *
     * @param {Function} [callback]
     */
    clearAnimals: function (callback) {
        var self = this;
        self.AnimalDB.clear(callback)
    },

    stop: function (callback) {
        async.eachSeries([this.AnimalDB, this.UserDB, this.SpeciesCollectionDB],
            function each(database, done) {
                database.stop(done);
            },
            function complete(err) {
                callback(err);
            })
    }

};

_.extend(MongoAPIDatabase.prototype, Debuggable.prototype);

module.exports = MongoAPIDatabase;
