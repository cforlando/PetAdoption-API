var path = require('path');

var _ = require('lodash');

var config = require('../config');
var Animal = require('../lib/animal');
var AnimalQuery = require('../lib/query');

var BaseDatabase = require('./lib/database');
var Collection = require('./lib/collection');
var DbError = require('./lib/error');
var AnimalSchema = require('./schemas/animal');

/**
 *
 * @extends BaseDatabase
 * @class AnimalDatabase
 * @param {Object} [options]
 * @param {MongoDbAdapter} [options.adapter]
 * @param {Boolean} [options.isDevelopment]
 * @param {String} [options.collectionNamePrefix]
 * @param {{complete: Function, isV1Format: Boolean}} [options.queryOptions] default query options
 * @returns {AnimalDatabase}
 * @constructor
 */
function AnimalDatabase(options) {
    var self = this;
    var _options = _.defaults(options, {
        collectionNamePrefix: config.DEVELOPMENT_ENV ? 'dev_' : 'prod_',
        queryOptions: {
            isV1Format: true
        }
    });

    BaseDatabase.call(this, this.collection);

    this.collection = new Collection(_options.collectionNamePrefix + 'animal', AnimalSchema);

    this.collection.addMiddleware('post', 'save', function (doc, next) {
        // TODO this never gets called
        if (!this.petId) {
            this.petId = this._id.toString();
            this.save(function (err) {
                next(err);
            });
        } else {
            next();
        }
    });

    this.collection.addMiddleware('post', 'findOneAndUpdate', function (doc) {
        if (doc && doc._id) doc.petId = doc._id.toString();
    });

    this.collection.addStaticMethod('upsert', function (searchProps, animalData, options) {
        var hasOptions = _.isPlainObject(options);
        var _options = _.defaults(hasOptions ? options : {}, {
            upsert: true,
            new: true
        });

        return new Promise(function (resolve, reject) {
            if (searchProps.petId) {
                self.MongooseModel.findOneAndUpdate({petId: searchProps.petId}, animalData, _options)
                    .lean()
                    .exec(function (err, animal) {
                        if (err) {
                            console.error(err);
                            reject(err);
                            return;
                        }

                        resolve(animal);
                    });
                return;
            }

            self.MongooseModel.create(animalData, function (err, newAnimal) {
                var newAnimalData;
                if (err || !newAnimal) {
                    reject(err || new Error("Animal could not be created"))
                }

                newAnimalData = newAnimal.toObject();

                resolve(newAnimalData)
            })
        });


    });

    this.setConfig('isDevelopment', _options.DEVELOPMENT_ENV);
    this.setConfig('queryOptions', _options.queryOptions);
    this.initDatabase();
}

AnimalDatabase.prototype = {


    /**
     *
     * @param {Animal} animal
     * @param {Object} options
     * @returns {Promise}
     */
    removeAnimal: function (animal, options) {
        var self = this;

        return new Promise(function (resolve, reject) {
            self.exec(function () {
                var petId = animal.getValue('petId');
                self.MongooseModel.remove({_id: petId}, function (err, removeOpInfo) {
                    if (err || (removeOpInfo.result && removeOpInfo.result.n == 0)) {
                        reject(new DbError(err || "Could not delete pet"));
                    }

                    resolve({result: 'success'})
                })
            });
        })
    },

    /**
     *
     * @param {Object|Object[]}props an object with v1 properties or an array of v1 property objects
     * @param {Object} options
     * @param {Species} [options.species]
     * @param {Boolean} [options.isV1Format] V1 format includes additional metadata
     * @param {Boolean} [options.isV1Format=true]
     * @returns {Promise}
     */
    findAnimals: function (props, options) {
        var self = this;
        var opts = _.defaults(options, self._config.queryOptions);

        return new Promise(function (resolve, reject) {
            self.exec(function () {
                var animalQuery = new AnimalQuery(props, opts.species);
                var animalMongoQuery = animalQuery.toMongoQuery();

                self.MongooseModel
                    .find(animalMongoQuery)
                    .lean()
                    .exec(function (err, animals) {
                        if (err) {
                            var dbErr = new DbError(err);
                            console.error(dbErr);
                            reject(dbErr);
                            return;
                        }

                        var result = animals.map(function (animalData) {
                            var newAnimal = new Animal(animalData.props);

                            newAnimal.setValue('petId', animalData._id.toString());

                            return opts.isV1Format ? newAnimal.toObject() : newAnimal.toLeanObject();
                        });
                        resolve(result);
                    })
            });
        })
    },

    /**
     *
     * @param {Animal} animal
     * @param {Object} options
     * @param {Boolean} [options.isV1Format] V1 format includes additional metadata
     * @returns {Promise}
     */
    saveAnimal: function (animal, options) {
        var self = this;
        var _options = _.defaults(options, self._config.queryOptions);
        var animalQuery = new AnimalQuery(animal.toObject());
        var animalMongoQuery = animalQuery.toMongoQuery();
        var animalDocData = animal.toMongooseDoc();

        return new Promise(function (resolve, reject) {

            self.exec(function () {
                var upsertOptions = {isV1Format: _options.isV1Format};

                self.MongooseModel.upsert(animalMongoQuery, animalDocData, upsertOptions)
                    .then(function (animalDoc) {
                        var newAnimal;
                        var result;

                        if (!animalDoc) {
                            err = new DbError("Animal Not Saved", 500);
                            console.error(err);
                            reject(err);
                            return;
                        }

                        newAnimal = new Animal(animalDoc.props);
                        newAnimal.setValue('petId', animalDoc._id.toString());

                        result = _options.isV1Format ? newAnimal.toObject() : newAnimal.toLeanObject();

                        resolve(result);
                    })
                    .catch(function (err) {
                        err = new DbError(err);
                        console.error(err);
                        reject(err);
                    });
            });
        })
    },
};

AnimalDatabase.prototype = Object.assign({}, BaseDatabase.prototype, AnimalDatabase.prototype);

module.exports = AnimalDatabase;
