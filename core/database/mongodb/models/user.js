var fs = require('fs'),
    path = require('path'),

    mongoose = require('mongoose'),
    _ = require('lodash'),

    config = require('../../../config');

function User(modelName, propsSchema, options) {

    this.options = _.defaults(options, {
        schemaNamespace: 'user'
    });
    this.modelName = modelName;
    this.propsSchema = propsSchema;

    return this.build();
}

User.prototype.methods = {};

User.prototype.middleware = {
    pre: {},
    post: {}
};

User.prototype.plugins = {
    timestamp: function (schema) {
        schema.add({timestamp: Date});

        schema.pre('save', function (next) {
            this.timestamp = new Date;
            next()
        })
    }
};

User.prototype.formatPropType = function (propType, metaData) {
    return propType;
}
User.prototype.buildPropSchema = function (propData, propName) {
    return this.formatPropType((propData && propData.type) ? propData.type : propData);
};

User.prototype.buildPropsSchema = function () {
    var schemaProps = {};
    for (var propName in this.propsSchema) {
        if (this.propsSchema.hasOwnProperty(propName)) {
            schemaProps[propName] = this.buildPropSchema(this.propsSchema[propName], propName);
        }
    }
    schemaProps['timestamp'] = Date;
    this.parsedPropsSchema = schemaProps;
};

User.prototype.buildSchema = function () {
    if (!this.parsedPropsSchema) this.buildPropsSchema();
    this.schema = mongoose.Schema(this.parsedPropsSchema);
    this.initSchema();
};

User.prototype.initSchema = function () {
    for (var methodName in this.methods) {
        if (this.methods.hasOwnProperty(methodName)) {
            this.schema.methods[methodName] = this.methods[methodName];
        }
    }

    for (var middlewareName in this.middleware) {
        if (this.middleware.hasOwnProperty(middlewareName)) {
            for (var eventName in this.middleware[middlewareName]) {
                if (this.middleware[middlewareName].hasOwnProperty(eventName)) {
                    this.schema[middlewareName](eventName, this.middleware[middlewareName][eventName]);
                }
            }
        }
    }

    for (var pluginMethodName in this.plugins) {
        if (this.middleware.hasOwnProperty(pluginMethodName)) {
            this.schema.plugin(pluginMethodName, this.middleware[pluginMethodName]);
        }
    }
};

User.prototype.build = function () {
    if (!this.schema) this.buildSchema();
    return mongoose.model(this.modelName, this.schema)
};

module.exports = User;
