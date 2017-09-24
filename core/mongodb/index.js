var util = require('util');
var path = require('path');
var fs = require('fs');

var _ = require('lodash');
var log = require('debug')('pet-api:mongodb');

var config = require('../config');
var Animal = require('../lib/animal');
var Species = require('../lib/species');

var DbError = require('./lib/error');
var SpeciesDbImage = require('./lib/species-db-image');
var UserDatabase = require('./user');
var SpeciesCollectionDatabase = require('./species-collection');
var AnimalDatabase = require('./animal');


/**
 *
 * @class MongoAPIDatabase
 * @param {Object} [options]
 * @param {Function} [options.onInitialized]
 * @param {String} [options.collectionNamePrefix]
 * @param {SpeciesDbImage[]} [options.preset]
 * @param {Function} [options.onPresetComplete]
 * @returns {MongoAPIDatabase}
 * @constructor
 */
function MongoAPIDatabase(options) {
    var _options = _.defaults(options, {
        collectionNamePrefix: config.DEVELOPMENT_ENV ? 'dev_' : 'prod_ ',
        // TODO this should probably be removed
        preset: process.env.DEMO && (function () {

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
                new SpeciesDbImage('cat', cats, catProps),
                new SpeciesDbImage('dog', dogs, dogProps)
            ];
        })()
    });


    log('Running in %s mode.', (config.DEVELOPMENT_ENV) ? 'dev' : 'prod');

    this.UserDb = new UserDatabase({collectionNamePrefix: _options.collectionNamePrefix});
    this.SpeciesCollectionDb = new SpeciesCollectionDatabase({collectionNamePrefix: _options.collectionNamePrefix});
    this.AnimalDb = new AnimalDatabase({collectionNamePrefix: _options.collectionNamePrefix});
    this.speciesCache = {};

    if (_options.preset && _options.preset.length > 0) this.uploadDbImages(_options.preset, _options.onPresetComplete);

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
            speciesCache[speciesData.speciesName] = new Species(speciesData.speciesName, speciesData.props);
            return speciesCache;
        }, this.speciesCache || {});
    },


    /**
     *
     * @param {SpeciesDbImage[]} speciesDbImages
     */
    uploadDbImages: function (speciesDbImages) {
        var self = this;

        return self.clearAnimals()
            .then(function () {
                // synchronous saving of each species
                var dbSavePromiseChain = speciesDbImages.reduce(function (savePromiseChain, dbImage) {
                    var speciesName = dbImage.getSpeciesName();
                    var speciesProps = dbImage.getSpeciesProps();
                    var animals = dbImage.getAnimals();

                    return savePromiseChain
                        .then(function () {
                            return self.saveSpecies(speciesName, speciesProps)
                        })
                        .then(function () {
                            return Promise.all(animals.map(function (animalData) {
                                return self.saveAnimal(speciesName, animalData);
                            }));
                        })

                }, Promise.resolve());

                return dbSavePromiseChain;
            });


    },


    /**
     *
     * @param {Object} [options]
     * @returns {Promise}
     */
    getSpeciesList: function (options) {
        var _options = _.defaults(options, {});

        return this.SpeciesCollectionDb.findLatest()
            .then(function (latestSpeciesCollection) {
                var speciesList = [];

                speciesList = latestSpeciesCollection.speciesList.map(function (speciesDoc) {
                    return speciesDoc.speciesName;
                });

                return Promise.resolve(speciesList);
            })
    },


    /**
     *
     * @param {Object} userData
     * @param {Object} [options]
     * @returns {Promise}
     */
    findUser: function (userData, options) {
        var _options = _.defaults(options, {});
        return this.UserDb.findOne(userData, _options);
    },


    /**
     *
     * @param {Object} userData
     * @param {Object} [options]
     * @returns {Promise}
     */
    saveUser: function (userData, options) {
        var _options = _.defaults(options, {});
        return this.UserDb.update({id: userData.id}, userData, _options);
    },


    /**
     *
     * @param {String} speciesName
     * @param {Object} [options]
     * @returns {Promise}
     */
    findSpecies: function (speciesName, options) {
        var self = this;
        var _options = _.defaults(options, {});

        return this.SpeciesCollectionDb.findLatest()
            .then(function (speciesCollectionDoc) {
                var speciesDoc = _.find(speciesCollectionDoc.speciesList, {speciesName: speciesName.toLocaleLowerCase()});

                self._saveToSpeciesCache(speciesCollectionDoc);

                if (!speciesDoc) {
                    console.error('invalid find species request: %s', speciesName);
                    return Promise.reject(new DbError.Species())
                }

                return Promise.resolve(speciesDoc);
            });
    },


    /**
     *
     * @param {String} speciesName
     * @param {Object} props
     * @param {Object} [options]
     * @returns {Promise}
     */
    saveSpecies: function (speciesName, props, options) {
        var self = this;
        var _options = _.defaults(options, {});
        var species = new Species(speciesName, props);

        return this.SpeciesCollectionDb.findLatest()
            .catch(function (err) {
                console.error(err);
                return Promise.resolve({speciesList: []})
            })
            .then(function (speciesCollectionDoc) {
                var newSpeciesDoc = species.toMongooseDoc();
                var prevSpeciesDoc = _.find(speciesCollectionDoc.speciesList, {speciesName: species.getSpeciesName()});
                var newSpeciesCollectionDoc;

                if (prevSpeciesDoc) {
                    // update referenced species doc in collection
                    speciesCollectionDoc.speciesList = speciesCollectionDoc.speciesList.map(function (speciesDoc) {
                        return speciesDoc.speciesName === newSpeciesDoc.speciesName ? newSpeciesDoc : speciesDoc
                    });
                } else {
                    // add new species to speciesCollection
                    speciesCollectionDoc.speciesList.push(newSpeciesDoc);
                }

                newSpeciesCollectionDoc = _.omit(speciesCollectionDoc, ['_id', '__v']);

                // this is unnecessary but can serve as a backup in case of data loss in the db
                // cache a copy of speciesCollection (currently a local json file)
                self._saveToSpeciesCache(newSpeciesCollectionDoc);

                return self.SpeciesCollectionDb.create(newSpeciesCollectionDoc);
            })
            .then(function (speciesCollectionDoc) {
                // only pass the species object that was saved
                return _.find(speciesCollectionDoc.speciesList, {speciesName: speciesName});
            })
    },


    /**
     *
     * @param {String} speciesName
     * @param {Object} [options]
     * @returns {Promise}
     */
    deleteSpecies: function (speciesName, options) {
        var self = this;
        var _options = _.defaults(options, {});

        return this.SpeciesCollectionDb.findLatest()
            .then(function (speciesCollectionDoc) {

                var newSpeciesCollectionDoc = _.chain(speciesCollectionDoc)
                    .omit(['_id', '__v']) // remove mongodb-generated properties
                    .set('speciesList', _.reject(speciesCollectionDoc.speciesList, {speciesName: speciesName}))
                    .value();

                // create a new speciesCollection to save to database
                // NOTE we are not updating, but creating a new speciesCollection each time
                // db size can become a concern if a species is updated many times
                return self.SpeciesCollectionDb.create(newSpeciesCollectionDoc);
            });
    },


    /**
     *
     * @param {String} speciesName
     * @param {Object} props
     * @param {Object} [options]
     * @returns {Promise}
     */
    removeAnimal: function (speciesName, props, options) {
        var opts = _.defaults(options, {
                species: this.speciesCache[speciesName]
            }),
            animal = new Animal(opts.species, props);

        return this.AnimalDb.removeAnimal(animal, opts);
    },


    /**
     *
     * @param {String} speciesName
     * @param {Object} props
     * @param {Object} [options]
     * @param {Function} [options.complete]
     * @returns {Promise}
     */
    saveAnimal: function (speciesName, props, options) {
        var opts = _.defaults(options, {
            species: this.speciesCache[speciesName] // reuse cached species instance
        });
        var animal = new Animal(opts.species, props);

        return this.AnimalDb.saveAnimal(animal, opts);

    },


    /**
     *
     * @param {Object} props
     * @param {Object} [options]
     * @param {Boolean} [options.isV1Format=true]
     */
    findAnimals: function (props, options) {
        var speciesProp = props.species || _.find(props, {key: 'species'});
        var speciesName = speciesProp ? speciesProp.val || speciesProp : Date.now(); // use invalid non-reoccuring name on species look failure
        var opts = _.defaults(options, {
            species: this.speciesCache[speciesName]
        });

        return this.AnimalDb.findAnimals(props, opts);
    },

    /**
     *
     * @returns {Promise}
     */
    clearAnimals: function () {
        return this.AnimalDb.clear()
    },
    /**
     *
     * @returns {Promise}
     */
    clearSpecies: function () {
        return this.SpeciesCollectionDb.clear()
    },

    /**
     *
     * @returns {Promise}
     */
    stop: function () {
        var dbs = [
            this.AnimalDb,
            this.UserDb,
            this.SpeciesCollectionDb
        ];

        return Promise.all(dbs.map(function (db) {
            return db.stop()
        }))
    }

};

module.exports = MongoAPIDatabase;
