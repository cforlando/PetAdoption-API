var util = require('util'),
    path = require('path'),
    fs = require('fs'),

    _ = require('lodash'),

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
 * @param {String} [options.collectionNamePrefix]
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
            collectionNamePrefix: config.DEVELOPMENT_ENV ? 'dev_' : 'prod_ ',
            // TODO this should probably be removed
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

    this.UserDB = new UserDatabase({collectionNamePrefix: _options.collectionNamePrefix});
    this.SpeciesCollectionDB = new SpeciesCollectionDatabase({collectionNamePrefix: _options.collectionNamePrefix});
    this.AnimalDB = new AnimalDatabase({collectionNamePrefix: _options.collectionNamePrefix});
    this.speciesCache = {};

    if (_options.preset && _options.preset.length > 0) this.uploadDBImages(_options.preset, _options.onPresetComplete);

    return this;
}

MongoAPIDatabase.prototype = {

    /**
     *
     * @param speciesCollectionDoc
     * @private
     */
    _saveToSpeciesCache: function (speciesCollectionDoc) {
        this.speciesCache = _.reduce(speciesCollectionDoc.speciesList, function (speciesCache, speciesData) {
            speciesCache[speciesData.name] = new Species(speciesData.name, speciesData.props);
            return speciesCache;
        }, this.speciesCache || {});
    },


    /**
     *
     * @param {SpeciesDBImage[]} speciesDBImages
     */
    uploadDBImages: function (speciesDBImages) {
        var self = this;


        function saveAnimals(speciesName, animals) {
            return Promise.all(animals.map(function (animalData) {
                return self.saveAnimal(speciesName, animalData);
            }));
        }

        function saveDBImage(dbImage) {
            return new Promise(function (resolve, reject) {
                self.saveSpecies(
                    dbImage.getSpeciesName(),
                    dbImage.getSpeciesProps(),
                    {
                        complete: function () {
                            saveAnimals(dbImage.getSpeciesName(), dbImage.getAnimals())
                                .then(resolve)
                                .catch(reject);
                        }
                    })
            });
        }

        var uploadPromiseHandler = function (resolve, reject) {
            self.clearAnimals(function () {
                var dbSaveOps = speciesDBImages.reduce(
                    function (saveOpChain, dbImage) {
                        return saveOpChain.then(function () {
                            return saveDBImage(dbImage)
                        });
                    }, Promise.resolve());

                dbSaveOps
                    .then(resolve)
                    .catch(reject);
            });
        };

        return new Promise(uploadPromiseHandler);


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
                    self._saveToSpeciesCache(speciesCollectionDoc);
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
                    // if (_options.complete) return _options.complete(err);
                    console.error(err);
                }

                // create speciesCollectionDoc if not already defined
                speciesCollectionDoc = speciesCollectionDoc || {speciesList: []};

                // search for species in speciesCollectionDoc
                var prevSpeciesDoc = _.find(speciesCollectionDoc.speciesList, {name: species.getSpeciesName()}),
                    newSpeciesDoc = species.toMongooseDoc();

                if (prevSpeciesDoc) {

                    // update referenced species doc in collection
                    speciesCollectionDoc.speciesList = speciesCollectionDoc.speciesList.map(function (speciesDoc) {
                        return speciesDoc.name == newSpeciesDoc.name ? newSpeciesDoc : speciesDoc
                    });

                } else {

                    // add new species to speciesCollection
                    speciesCollectionDoc.speciesList.push(newSpeciesDoc);

                }

                var newSpeciesCollectionDoc = _.omit(speciesCollectionDoc, ['_id', '__v']);

                // this is unnecessary but can serve as a backup in case of data loss in the db
                // cache a copy of speciesCollection (currently a local json file)
                self._saveToSpeciesCache(newSpeciesCollectionDoc);

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

                // create a new speciesCollection to save to database
                // NOTE we are not updating, but creating a new speciesCollection each time
                // db size can become a concern if a species is updated many times
                var newSpeciesCollectionDoc = _.chain(speciesCollectionDoc)
                    .omit(['_id', '__v']) // remove mongodb-generated properties
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
        var opts = _.defaults(options, {
                species: this.speciesCache[speciesName]
            }),
            animal = new Animal(opts.species, props);

        this.AnimalDB.removeAnimal(animal, opts);
    },


    /**
     *
     * @param {String} speciesName
     * @param {Object} props
     * @param {Object} [options]
     * @param {Function} [options.complete]
     */
    saveAnimal: function (speciesName, props, options) {
        var self = this;
        return new Promise(function (resolve, reject) {
            var _opts = _.defaults({

                    // reuse cached species instance
                    species: self.speciesCache[speciesName],

                    // TODO remove support for saveAnimal options.complete callback
                    // wrap callback
                    complete: function (err, animalData) {
                        if (options && options.complete) {
                            options.complete.apply(null, arguments);
                        }
                        err ? reject(err) : resolve(animalData);
                    }
                }, options),
                animal = new Animal(_opts.species, props);

            self.AnimalDB.saveAnimal(animal, _opts);
        })

    },


    /**
     *
     * @param {Object} props
     * @param {Object} [options]
     * @param {Boolean} [options.isV1Format=true]
     * @param {Function} [options.complete]
     */
    findAnimals: function (props, options) {
        var _options = _.defaults(options, {
            species: this.speciesCache[this._getAnimalSpeciesFromProps(props)]
        });

        this.AnimalDB.findAnimals(props, _options);
    },

    _getAnimalSpeciesFromProps: function (props) {
        var speciesProp = props.species || _.find(props, {key: 'species'});
        return speciesProp ? speciesProp.val || speciesProp : null;
    },

    /**
     *
     * @param {Function} [callback]
     */
    clearAnimals: function (callback) {
        return this.AnimalDB.clear(callback)
    },

    stop: function (callback) {
        return Promise.all([
            this.AnimalDB,
            this.UserDB,
            this.SpeciesCollectionDB
        ].map(function (db) {
            return db.stop()
        })).then(function () {
            if (callback) callback();
            return Promise.resolve();
        })
    }

};

_.extend(MongoAPIDatabase.prototype, Debuggable.prototype);

module.exports = MongoAPIDatabase;
