var util = require("util"),

    _ = require('lodash'),

    Debuggable = require('./debuggable'),
    Species = require('./species');

/**
 *
 * @extends Species
 * @class Animal
 * @param [species]
 * @param [values]
 * @constructor
 */
function Animal(species, values) {
    var defaultSpeciesName = 'n/a',
        defaultSpeciesProps = [];

    if (species instanceof Species) {
        Species.call(this, species.getSpeciesName(), species.getSpeciesProps());
        if (!this.getValue('species')) this.setValue('species', species.getSpeciesName());

    } else {
        // species not passed
        Species.call(this, defaultSpeciesName, defaultSpeciesProps);

        if (species) {
            // props or values were passed instead
            // rename for semantic reasons
            values = species;
        }
    }

    if (_.isArray(values)) {
        this.setProps(values);
    } else if (_.isPlainObject(values)) {
        this.setValues(values);
    }

}

Animal.prototype = {

    getValue: function (propName) {
        var prop = _.find(this.props, {key: propName});
        return prop ? prop.val : null;
    },

    setValue: function (propName, propValue) {
        var prop;
        if (propValue.val) {
            // v1
            prop = this.getProp(propName) || propValue;
            prop.val = propValue.val;
        } else {
            prop = this.getProp(propName) || {key: propName};
            prop.val = propValue;
        }
        this.setProps([prop]);
    },

    setValues: function (propData) {
        var self = this;
        _.forEach(propData, function (propValue, propName) {
            self.setValue(propName, propValue);
        });
    },

    toArray: function () {
        return this.props;
    },

    toMongooseDoc: function () {
        return {
            petId: this.getValue('petId'),
            props: this.getProps()
        }
    },

    toObject: function (options) {
        var _options = _.defaults(options, {
                isV1Format: true
            }),
            self = this;
        return _.reduce(this.props, function (propCollection, propData) {
            var propValue = propData.val;
            self.log(Debuggable.HIGH, "parsing prop '%s' for response", propData.key);
            switch (propData.key) {
                case '_id':
                case '__v':
                    // skip internal mongodb fields
                    return propCollection;
                    break;
                case 'petId':
                    if (propData.val) {
                        propValue = propData.val.toString();
                    }
                    break;
                default:
                    break;
            }

            switch (propData.valType) {
                case 'Boolean':
                    if (_.isString(propData.val)) {
                        propValue = /y|yes/i.test(propData.val)
                    }
                case 'Date':
                    if (_.isDate(propData.val)) {
                        propValue = propData.val.toISOString();
                    }
                    break;
                default:
                    break;
            }

            if (propValue != undefined && propValue != null) {
                propData.val = propValue;
                propCollection[propData.key] = (_options.isV1Format) ? propData : propValue;
            }
            return propCollection;
        }, {});
    },

    toLeanObject: function (options) {
        return this.toObject(_.defaults({isV1Format: false}, options));
    },

    toQuery: function (metaProps) {

        var self = this,
            queryMetaProps = metaProps || {},
            query = {};

        this.log(Debuggable.MED, 'building query with props: %s', this.dump(this.props));

        this.props.forEach(function (prop) {
            var propName = prop.key,
                queryFieldName = propName,
                propValue = prop.val;

            // only process valid props
            if (propValue !== undefined && propValue !== null && _.find(self.props, {key: prop.key})) {
                self.log(Debuggable.HIGH, 'parsing %s', propName);

                //build query
                switch (propName) {
                    case 'petId':
                    case 'hashId':
                    case '_id':
                        // only use given id and quit early
                        query = {
                            petId: propValue
                        };
                        self.log(Debuggable.LOW, 'searching by id: %s', propValue);
                        return false;
                    case 'species':
                        query[queryFieldName] = new RegExp(propValue.toString(), 'i');
                        break;
                    case 'images':
                        // ignore images
                        break;
                    default:
                        if (prop.valType && prop.valType.toLowerCase() == 'string') {
                            var prefix = '',
                                suffix = '',
                                regexArgs = '';
                            if (queryMetaProps.matchStartFor && _.includes(queryMetaProps.matchStartFor, propName)) {
                                prefix = '^';
                            }
                            if (queryMetaProps.matchEndFor && _.includes(queryMetaProps.matchEndFor, propName)) {
                                suffix = '$';
                            }
                            if (queryMetaProps.ignoreCaseFor && _.includes(queryMetaProps.ignoreCaseFor, propName)) {
                                regexArgs = 'i';
                            }
                            if (propName == 'color' || propName == 'petName') {
                                // ignore case for color,petName searches
                                regexArgs = 'i';
                            }
                            query[queryFieldName] = new RegExp(util.format('%s%s%s', prefix, propValue.toString(), suffix), regexArgs);
                        } else {
                            query[queryFieldName] = propValue;
                        }
                        break;
                }
            }

        });

        this.log(Debuggable.LOW, 'built query: %s', this.dump(query));
        // return {props: {$elemMatch: query}};
        return query;
    }
};

_.defaults(Animal.prototype, Species.prototype);

module.exports = Animal;