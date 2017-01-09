var _ = require('lodash'),
    mongoose = require('mongoose'),

    Debuggable = require('../../lib/debuggable');

/**
 * @class Collection
 * @param {String} namespace
 * @param {Object} schema
 * @param {Object} [options]
 * @param {Object} [options.debugLevel]
 * @param {String} [options.debugTag]
 * @returns {Collection}
 * @constructor
 */
function Collection(namespace, schema, options) {
    var self = this,
        _options = _.defaults(options, {
            debugLevel: Debuggable.PROD,
            debugTag: 'TimestampedModelFactory: '
        });

    this.setCollectionName(namespace);
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

Collection.prototype = {

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
        this.mongooseModel = mongooseInstance.model(this.collectionName, this.toMongooseSchema());
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

    _validateCollectionName: function (callback) {
        if (!(_.isString(this.collectionName) && this.collectionName.length > 0)) {
            return callback(new Error("Invalid collectionName supplied"))
        }
        return callback();
    },


    _validate: function () {
        this._validateCollectionName(function (err) {
            if (err) throw err;
        });
    },


    /**
     *
     * @param {String} collectionName
     */
    setCollectionName: function (collectionName) {
        this.collectionName = collectionName;
    },


    /**
     *
     * @returns {String}
     */
    getCollectionName: function () {
        return this.collectionName;
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
    },

    _buildSchema : function () {
        this.mongooseSchema = mongoose.Schema(this.schema);
        for (var staticMethodName in this.statics) {
            if (this.statics.hasOwnProperty(staticMethodName)) {
                this.mongooseSchema.statics[staticMethodName] = this.statics[staticMethodName];
            }
        }

        for (var methodName in this.methods) {
            if (this.methods.hasOwnProperty(methodName)) {
                this.mongooseSchema.methods[methodName] = this.methods[methodName];
            }
        }

        for (var middlewareName in this.middleware) {
            if (this.middleware.hasOwnProperty(middlewareName)) {
                for (var eventName in this.middleware[middlewareName]) {
                    if (this.middleware[middlewareName].hasOwnProperty(eventName)) {
                        this.mongooseSchema[middlewareName](eventName, this.middleware[middlewareName][eventName]);
                    }
                }
            }
        }

        for (var pluginMethodName in this.plugins) {
            if (this.plugins.hasOwnProperty(pluginMethodName)) {
                this.mongooseSchema.plugin(this.plugins[pluginMethodName]);
            }
        }
        return this.mongooseSchema;
    },

    /**
     *
     * @param {String} methodName
     * @param {Function} methodFunc
     */
    addStaticMethod : function (methodName, methodFunc) {
        this.statics = this.statics || {}; // init if not created
        this.statics[methodName] = methodFunc;
    },

    /**
     *
     * @param {String} methodName
     * @param {Function} methodFunc
     */
    addMethod : function (methodName, methodFunc) {
        this.methods = this.methods || {}; // init if not created
        this.methods[methodName] = methodFunc;
    },

    /**
     *
     * @param {String} pluginName
     * @param {Function} pluginFunc
     */
    addPlugin : function (pluginName, pluginFunc) {
        this.plugins = this.plugins || {}; // init if not created
        this.plugins[pluginName] = pluginFunc;
    },

    /**
     *
     * @param {String} middlewareName will either be 'pre' or 'post'
     * @param {String} eventName
     * @param {Function} middlewareFunc
     */
    addMiddleware : function (middlewareName, eventName, middlewareFunc) {
        this.middleware = this.middleware || {
                pre: {},
                post: {}
            }; // init if not created
        this.middleware[middlewareName][eventName] = middlewareFunc;
    },

    /**
     *
     * @param {String} propName
     * @param {Function|Object} propType A valid Mongoose Schema Type
     */
    addSchemaProp : function (propName, propType) {
        this.schema = this.schema || {};
        this.schema[propName] = propType;
    },

    /**
     *
     * @param {Object} schema
     */
    setSchema : function(schema){
        this.schema = schema;
    },

    /**
     *
     * @returns {Function} propType A valid Mongoose Schema Type
     */
    getSchema : function () {
        return this.schema || {};
    },

    /**
     * @returns {Schema}
     */
    toMongooseSchema : function () {
        return this._buildSchema();
    }
};

_.extend(Collection.prototype, Debuggable.prototype);

module.exports = Collection;

