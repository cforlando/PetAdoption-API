var _ = require('lodash'),
    mongoose = require('mongoose'),

    Debuggable = require('../../lib/debuggable'),
    Schema = require('./schema-factory');

/**
 * @extends SchemaFactory
 * @class ModelFactory
 * @param {String} namespace
 * @param {Object} schema
 * @param {Object} [options]
 * @param {Object} [options.debugLevel]
 * @param {String} [options.debugTag]
 * @returns {ModelFactory}
 * @constructor
 */
function ModelFactory(namespace, schema, options) {
    var self = this,
        _options = _.defaults(options, {
            debugLevel: Debuggable.PROD,
            debugTag: 'TimestampedModelFactory: '
        });

    this.setModelName(namespace);
    this.setDebugTag(_options.debugTag);
    this.setDebugLevel(_options.debugLevel);
    for (var propName in schema) {
        if (schema.hasOwnProperty(propName)) {
            var propData = schema[propName],
                propValueSchemaType = (_.isString(propData.valType)) ? this.getPropValueSchemaType(propName) : propData;
            this.addSchemaProp(propName, propValueSchemaType);
        }
    }
    if (_options.init) _options.init.apply(this);
}

ModelFactory.prototype = {

    /**
     *
     * @param {MongoDBAdapter|String} adapter
     * @returns {Model|*}
     * @private
     */
    _buildMongooseModel: function (adapter) {
        var mongooseInstance;

        if (adapter.getMongoose) {
            mongooseInstance = adapter.getMongoose();
        } else {
            // create mongoose instance from string
            mongooseInstance = mongoose.createConnection(adapter);
        }
        this.mongooseModel = mongooseInstance.model(this.modelName, this.toMongooseSchema());
        return this.mongooseModel;
    },

    /**
     *
     * @param {MongoDBAdapter} adapter
     * @returns {*|Aggregate|Model}
     */
    toMongooseModel: function (adapter) {
        var url = "";
        this._validate();
        this._buildMongooseModel(adapter || url);
        return this.mongooseModel;
    },

    _validateModelName: function (callback) {
        if (!(_.isString(this.modelName) && this.modelName.length > 0)) {
            return callback(new Error("Invalid modelName supplied"))
        }
        return callback();
    },


    _validate: function () {
        this._validateModelName(function (err) {
            if (err) throw err;
        });
    },


    /**
     *
     * @param {String} modelName
     */
    setModelName: function (modelName) {
        this.modelName = modelName;
    },


    /**
     *
     * @returns {String}
     */
    getModelName: function () {
        return this.modelName;
    },

    /**
     *
     * @param propName
     * @returns {Function|Function[]} A Valid Schema Type
     */
    getPropValueSchemaType: function (propName) {
        var propData = this.props[propName],
            isArray = _.isArray(propData.valType),
            propType = isArray ? propData.valType[0] : propData.valType,
            schemaResult = mongoose.Schema.Types.Mixed;
        if (propType) {
            switch (propData.valType) {
                case 'String':
                    schemaResult = String;
                    break;
                case 'Location':
                case 'Number':
                case 'Float':
                    schemaResult = Number;
                    break;
                default:
            }
            return isArray ? [schemaResult] : schemaResult;
        } else {
            return propData;
        }
    }
};

_.extend(ModelFactory.prototype, Schema.prototype);

module.exports = ModelFactory;

