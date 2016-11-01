var path = require('path'),
    fs = require('fs'),

    _ = require('lodash'),

    Debuggable = require('../../../lib/debuggable/index'),
    Database = require('./index'),
    AnimalModelFactory = require('./../animal-model-factory'),
    config = require('../../../config'),
    DBError = require('../error');

/**
 *
 * @extends Database
 * @class AnimalDatabase
 * @param {String} speciesName
 * @param {Object} speciesProps
 * @param {Object} [options]
 * @param {Boolean} [options.isDevelopment]
 * @param {DebugLevel} [options.debugLevel]
 * @param {String} [options.debugTag]
 * @param {String} [options.modelNamePrefix]
 * @param {{complete: Function, isV1Format: Boolean}} [options.queryOptions] default query options
 * @returns {AnimalDatabase}
 * @constructor
 */
function AnimalDatabase(speciesName, speciesProps, options) {
    var self = this,
        _options = _.defaults(options, {
            debugLevel: Debuggable.PROD,
            debugTag: this.format("AnimalDatabase(%s): ", speciesName),
            modelNamePrefix: (config.DEVELOPMENT_ENV) ? 'dev' : 'prod',
            queryOptions: {
                complete: function (err) {
                    if (err) self.warn(err);
                    return err;
                }
            }
        });

    var animalDocName = this.format('%s_%s_animal', _options.modelNamePrefix, speciesName);

    this._super.call(this, new AnimalModelFactory(animalDocName, speciesProps, {
        debugTag: this.format('AnimalModel(%s): ', speciesName),
        debugLevel: this.getDebugLevel()
    }), options);

    this.speciesProps = speciesProps;

    this.setDebugLevel(_options.debugLevel);
    this.setDebugTag(_options.debugTag);

    this.setConfig('isDevelopment', _options.DEVELOPMENT_ENV);
    this.setConfig('queryOptions', _options.queryOptions);
    this.setConfig('speciesName', speciesName);


    this.exec(function () {
        self.log(Debuggable.TMI, 'latest %s species model:', speciesName, self.dump(speciesProps));

        // init animals db document for given species
        self.AnimalModel = this.modelFactory.generateMongooseModel(self.getAdapter());
    }, {
        context: this
    });

    return this;
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
     * @param {Object} props
     * @param {Object} options
     * @param {Boolean} [options.debug] Whether to log debug info
     * @param {RemoveCallback} options.complete callback on operation completion
     * @param {Object} [options.context] context for complete function callback
     */
    removeAnimal: function (props, options) {
        var self = this,
            _options = _.defaults(options, self._config.queryOptions);

        this.exec(function () {

            self.log(Debuggable.MED, 'mongodb.removeAnimal() - searching for: ', props.petId || props._id);
            self.AnimalModel.remove({
                _id: props.petId || props._id
            }, function (err, removeData) {
                if (err || (removeData.result && removeData.result.n == 0)) {
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
                if (_options.complete) _options.complete(err, animals.responseFormat);
            })
        });
    },

    /**
     *
     * @param {Object} props
     * @param {Object} options
     * @param {Boolean} [options.isV1Format] V1 format includes additional metadata
     * @param {AnimalQueryCallback} options.complete callback on operation completion
     * @param {Object} [options.context] context for complete function callback
     */
    saveAnimal: function (props, options) {
        var self = this,
            _options = _.defaults(options, self._config.queryOptions);

        this.exec(function () {
            self.log(Debuggable.MED, "[%s].saveAnimal() - received post for: %s", self.getConfig('speciesName'), self.dump(props));


            var animal = new self.AnimalModel(props);
            animal.upsert(props, {
                isV1Format: _options.isV1Format
            }, function (err, animalDoc) {
                if (err) {
                    err = new DBError(err);
                    self.error(err);
                    if (_options.complete) _options.complete(err);
                } else if (animalDoc) {
                    self.log(Debuggable.MED, 'saved and sending animal: ', animalDoc.responseFormat);
                    if (_options.complete) _options.complete(err, animalDoc.responseFormat);
                } else {
                    var saveErr = new DBError("Animal Not Saved", 500);
                    self.error(saveErr);
                    if (_options.complete) _options.complete(saveErr);
                }
            });

        });
    }
};

_.extend(AnimalDatabase.prototype, Database.prototype);

module.exports = AnimalDatabase;
