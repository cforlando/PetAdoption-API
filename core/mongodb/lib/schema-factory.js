var mongoose = require('mongoose'),
    _ = require('lodash'),

    Debuggable = require('../../lib/debuggable/index');


/**
 * @extends Debuggable
 * @class SchemaFactory
 * @returns {SchemaFactory}
 * @constructor
 */
function SchemaFactory() {}

SchemaFactory.prototype = {

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

_.extend(SchemaFactory.prototype, Debuggable.prototype);

module.exports = SchemaFactory;
