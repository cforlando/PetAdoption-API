var path = require('path'),
    fs = require('fs'),

    _ = require('lodash'),

    config = require('../config'),
    Debuggable = require('../lib/debuggable/index'),

    Database = require('./default'),
    ModelFactory = require('./lib/model-factory'),
    DBError = require('./lib/error'),
    Animal = require('../lib/animal'),
    AnimalSchema = require('./schemas/animal');

/**
 *
 * @extends Database
 * @class AnimalDatabase
 * @param {Object} [options]
 * @param {Boolean} [options.isDevelopment]
 * @param {DebugLevel} [options.debugLevel]
 * @param {String} [options.debugTag]
 * @param {String} [options.modelNamePrefix]
 * @param {{complete: Function, isV1Format: Boolean}} [options.queryOptions] default query options
 * @returns {AnimalDatabase}
 * @constructor
 */
function AnimalDatabase(options) {
    var self = this,
        _options = _.defaults(options, {
            debugLevel: Debuggable.PROD,
            debugTag: "AnimalDatabase: ",
            modelNamePrefix: config.DEVELOPMENT_ENV ? 'dev_' : 'prod_',
            queryOptions: {
                complete: function (err) {
                    if (err) self.warn(err);
                    return err;
                },
                isV1Format: true
            }
        });

    this._model = new ModelFactory(_options.modelNamePrefix + 'animal', AnimalSchema);

    this._model.addMiddleware('post', 'save', function (doc, next) {
        // TODO this never gets called
        if (!doc.petId) {
            doc.petId = doc._id.toString();
            self.log(Debuggable.LOW, 'post.save - updating petId');
            this.save(doc, function (err) {
                next(err);
            });
        } else {
            self.log(Debuggable.LOW, 'post.save - setting responseFormat');
            next();
        }
    });

    this._model.addMiddleware('post', 'findOneAndUpdate', function (doc) {
        self.log(Debuggable.LOW, 'post.save - updating petId');

        if (doc && doc._id) doc.petId = doc._id.toString();
    });

    this._model.addStaticMethod('upsert', function (searchProps, saveData, options, callback) {
        var hasOptions = _.isPlainObject(options),
            _options = _.defaults(hasOptions ? options : {}, {
                upsert: true,
                new: true
            }),
            onComplete = (hasOptions) ? callback : options,
            doc = this,
            model = this.model(self._model.getModelName());

        self.log(Debuggable.LOW, 'upsert() w/ options %s', self.dump(_options));

        if (searchProps.petId) {
            model.findOneAndUpdate({petId: searchProps.petId}, saveData, _options)
                .lean()
                .exec(function (err, animal) {
                    if (err) {
                        self.error(err);
                    } else {
                        self.log(Debuggable.LOW, 'updated animal: %s', animal._id);
                    }
                    if (onComplete) onComplete(err, animal);
                });
        } else {
            model.create(saveData, function (err, newAnimal) {
                self.log(Debuggable.LOW, 'created new animal: %s', newAnimal._id);
                var newAnimalData = newAnimal.toObject();

                if (!err && !newAnimal) err = new Error("Animal could not be created");

                if (onComplete) {
                    if (err) {
                        onComplete(err)
                    } else {
                        onComplete(null, newAnimalData)
                    }
                }
            })
        }
    });

    this._model.addStaticMethod('findAnimals', function (props, options, callback) {
        self.log(Debuggable.MED, 'Received query for %s', self.dump(props));
        var hasOptions = _.isPlainObject(options),
            _options = hasOptions ? _.defaults(options, {}) : {},
            onComplete = (hasOptions) ? callback : options,
            query;

        if (props._id || props.petId) {
            query = {
                petId: props._id || props.petId
            };
        } else if (_.keys(props).length == 0) {
            query = {}
        } else {
            query = {
                props: {
                    $all: _.reduce(props, function (propsCollection, propValue, propName) {
                        propsCollection.push({
                            $elemMatch: {
                                key: propName,
                                val: propValue
                            }
                        });
                        return propsCollection;
                    }, [])
                }
            };
        }


        this.model(self._model.getModelName())
            .find(query)
            .lean()
            .exec(function (err, animals) {
                if (err) {
                    self.error(err);
                    onComplete(err);
                } else {
                    self.log(Debuggable.MED, 'findAnimals() - found %s w/ %o', animals.length, query);
                    self.log(Debuggable.TMI, 'findAnimals() - found animals (preformatted): ', animals);
                    onComplete(err, animals);
                }
            })
    });

    Database.call(this, this._model);

    this.setDebugLevel(_options.debugLevel);
    this.setDebugTag(_options.debugTag);

    this.setConfig('isDevelopment', _options.DEVELOPMENT_ENV);
    this.setConfig('queryOptions', _options.queryOptions);

    self.AnimalModel = self.MongooseModel;
}

AnimalDatabase.prototype = {


    /**
     * @callback RemoveCallback
     * @param err
     * @param resultData
     * @param {String} resultData.result will be either 'success' or 'failure'
     */
    /**
     *
     * @param {Animal} animal
     * @param {Object} options
     * @param {Boolean} [options.debug] Whether to log debug info
     * @param {RemoveCallback} options.complete callback on operation completion
     * @param {Object} [options.context] context for complete function callback
     */
    removeAnimal: function (animal, options) {
        var self = this,
            _options = _.defaults(options, self._config.queryOptions);

        this.exec(function () {

            var petId = animal.getValue('petId');
            self.log(Debuggable.MED, 'mongodb.removeAnimal() - searching for: ', petId);
            self.AnimalModel.remove({_id: petId}, function (err, removeOpInfo) {
                if (err || (removeOpInfo.result && removeOpInfo.result.n == 0)) {
                    err = new DBError(err || "Could not delete pet");
                }
                self.log(Debuggable.MED, 'removeAnimal() - args: %s', self.dump(arguments));
                if (_options.complete) _options.complete(err, {result: (err) ? 'failure' : 'success'});
            })
        });
    },

    /**
     * @callback AnimalQueryCallback
     * @param {DBError} err
     * @param {Object|Object[]} animals
     */


    /**
     *
     * @param props
     * @param {Object} options
     * @param {Boolean} [options.isV1Format] V1 format includes additional metadata
     * @param {AnimalQueryCallback} options.complete callback on operation completion
     * @param {Boolean} [options.isV1Format=true]
     * @param {Object} [options.context] context for complete function callback
     */
    findAnimals: function (props, options) {
        var self = this,
            _options = _.defaults(options, self._config.queryOptions);

        self.log(Debuggable.HIGH, "findAnimals(%s)", this.dump(arguments));

        this.exec(function () {
            self.log(Debuggable.HIGH, "mongodb.findAnimals() - received query for: ", props);

            self.AnimalModel.findAnimals(props, {
                isV1Format: _options.isV1Format
            }, function (err, animals) {
                if (err) {
                    err = new DBError(err);
                    self.error(err);
                }
                if (_options.complete) _options.complete(err, animals.map(function (animalData) {
                    var newAnimal = new Animal(animalData.props);
                    newAnimal.setValue('petId', animalData._id.toString());
                    return _options.isV1Format ? newAnimal.toObject() : newAnimal.toLeanObject();
                }));
            })
        });
    },

    /**
     *
     * @param {Animal} animal
     * @param {Object} options
     * @param {Boolean} [options.isV1Format] V1 format includes additional metadata
     * @param {AnimalQueryCallback} options.complete callback on operation completion
     * @param {Object} [options.context] context for complete function callback
     */
    saveAnimal: function (animal, options) {
        var self = this,
            _options = _.defaults(options, self._config.queryOptions),
            query = animal.toQuery(),
            animalDocData = animal.toMongooseDoc();

        this.exec(function () {

            this.AnimalModel.upsert(
                query,
                animalDocData,
                {
                    isV1Format: _options.isV1Format
                },
                function (err, animalDoc) {
                    if (err) {
                        err = new DBError(err);
                        self.error(err);
                        if (_options.complete) _options.complete(err);
                    } else if (animalDoc) {
                        self.log(Debuggable.MED, 'saved and sending animal: ', animalDoc);
                        var newAnimal = new Animal(animalDoc.props);
                        newAnimal.setValue('petId', animalDoc._id.toString());
                        if (_options.complete) _options.complete(err, _options.isV1Format ? newAnimal.toObject() : newAnimal.toLeanObject());
                    } else {
                        var saveErr = new DBError("Animal Not Saved", 500);
                        self.error(saveErr);
                        if (_options.complete) _options.complete(saveErr);
                    }
                });
        });
    },

    /**
     *
     * @param {Function} [callback]
     */
    clear: function (callback) {
        this.AnimalModel.remove({}, function (err) {
            if (callback) callback(err);
        });
    }
};

_.extend(AnimalDatabase.prototype, Database.prototype);

module.exports = AnimalDatabase;
