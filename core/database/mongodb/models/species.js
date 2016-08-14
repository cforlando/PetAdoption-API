var fs = require('fs'),
    path = require('path'),

    mongoose = require('mongoose'),
    _ = require('lodash'),

    config = require('../../../config');

function Species(modelName, propsSchema, options) {

    this.options = _.defaults(options, {
        schemaNamespace: 'dog'
    });

    this.modelName = modelName || 'cat';

    this.propsSchema = propsSchema || (function () {
            try {
                return JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'data/schema.json'), {encoding: 'utf8'}))[this.options.schemaNamespace]
            } catch (err) {
                console.error('schema init error: %s', err);
                return {};
            }
        }).call(this);


    return this.build();
}

Species.prototype.methods = {
    getSpecies: function () {
        return this.species.val || this.species.defaultVal || this.species.example;
    }
};

Species.prototype.middleware = {
    pre: {},
    post: {}
};

Species.prototype.plugins = {
    timestamp: function (schema) {
        schema.add({timestamp: Date});

        schema.pre('save', function (next) {
            this.timestamp = new Date;
            next()
        })
    }
};

Species.prototype.formatPropType = function (propType, metaData) {
    return {
        defaultVal: (metaData.isArray) ? [propType] : propType,
        valType: String,
        name: String,
        key: String,
        fieldLabel: String,
        description: String,
        required: String,
        example: (metaData.isArray) ? [propType] : propType,
        note: String,
        options: [propType]
    }
};

Species.prototype.buildPropSchema = function (propData, propName) {
    var propType = propData.type,
        isArrayProp = false;

    if (!propType) {
        console.log(" can't parse %s", propName);
        return false; // ignore invalid props
    }
    if (_.isArray(propType)) {
        propType = propType[0];
        isArrayProp = true;
    }
    switch (propType) {
        case '[Image]':
            isArrayProp = true;
            propType = String;
            break;
        case 'Location':
        case 'Number':
            if (propName == 'petId') {
                propType = String;
            } else if (/(Lat|Lon)$/.test(propName)) {
                isArrayProp = true;
                propType = Number;
            } else {
                propType = Number;
            }
            break;
        case 'Date':
            propType = Date;
            break;
        case 'Boolean':
            propType = Boolean;
            break;
        default:
            propType = String;
            break;
    }
    return this.formatPropType(propType, {
        isArray: isArrayProp,
        isLoc: false
    });
};

Species.prototype.buildPropsSchema = function () {
    var schemaProps = {};
    for (var propName in this.propsSchema) {
        if (this.propsSchema.hasOwnProperty(propName)) {
            schemaProps[propName] = this.buildPropSchema(this.propsSchema[propName], propName);
        }
    }
    schemaProps['timestamp'] = Date;
    this.parsedPropsSchema = schemaProps;
};

Species.prototype.buildSchema = function () {
    if (!this.parsedPropsSchema) this.buildPropsSchema();
    this.schema = mongoose.Schema(this.parsedPropsSchema);
    this.initSchema();
};

Species.prototype.initSchema = function () {
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

Species.prototype.build = function () {
    if (!this.schema) this.buildSchema();
    console.log('building schema - %s', this.modelName);
    return mongoose.model(this.modelName, this.schema)
};

module.exports = Species;