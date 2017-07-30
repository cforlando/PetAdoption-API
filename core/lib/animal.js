var _ = require('lodash'),

    AnimalQuery = require('./query'),
    Species = require('./species');

/**
 *
 * @extends Species
 * @class Animal
 * @param {Species|Object[]|Object} [species] - a Species instance, an array of properties, or an object of species property key-value pairs
 * @param {Object} [values] - the object of species property key-value pairs
 * @constructor
 */
function Animal(species, values) {
    var defaultSpeciesName = 'n/a';
    var defaultSpeciesProps = [];

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
    } else if (typeof values === 'object') {
        this.setValues(values);
    }

}

Animal.prototype = {

    getValue: function (propName) {
        var prop = _.find(this.props, {key: propName});
        return prop ? prop.val : null;
    },

    getId: function () {
        return this.getValue('petId')
    },

    getSpeciesName: function () {
        return this.getValue('species')
    },

    getName: function () {
        return this.getValue('petName')
    },

    setValue: function (propName, propValue) {
        var prop;
        if (propValue.val !== undefined) {
            // propValue is v1 format and contains metadata
            prop = this.getProp(propName) || propValue;
            prop.val = propValue.val;
        } else {
            prop = this.getProp(propName) || {key: propName};
            prop.val = propValue;
        }
        this.setProps([prop]);

        // also set speciesName in doc to reflect species change in both places
        if (propName === 'species') {
            this.speciesName = prop.val;
        }
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
            speciesName: this.getSpeciesName(),
            props: this.getProps().map(function (propData) {
                switch (propData.valType) {
                    case 'Number':
                        propData.val = parseInt(propData.val);
                        break;
                    case 'Float':
                        propData.val = parseFloat(propData.val);
                        break;
                    case 'Boolean':
                        if (!_.isBoolean(propData.val)) {
                            propData.val = /yes|true/i.test(propData.val)
                        }
                        break;
                    case 'Date':
                        if (_.isDate(propData.val)) {
                            propData.val = propData.val.toISOString();
                        }
                        break;
                    default:
                        break;
                }
                return propData;
            })
        }
    },

    toObject: function (options) {
        var _options = _.defaults(options, {
                isV1Format: true
            }),
            self = this;
        return _.reduce(this.props, function (propCollection, propData) {
            var propValue = propData.val;
            switch (propData.key) {
                // skip internal mongodb fields
                case '_id':
                case '__v':
                    return propCollection;
                    break;
                case 'petId':
                    // format animal's mongo ObjectId to string as `petId`
                    if (propData.val) {
                        propValue = propData.val.toString();
                    }
                    break;
                default:
                    break;
            }

            switch (propData.valType) {
                case 'Boolean':
                    // convert boolean values that are strings to proper boolean value
                    if (_.isString(propData.val)) {
                        propValue = /yes|true/i.test(propData.val)
                    }
                    break;
                case 'Date':
                    if (_.isDate(propData.val)) {
                        propValue = propData.val.toISOString();
                    }
                    break;
                default:
                    break;
            }

            if (!(propValue === undefined || propValue === null)) {
                propData.val = propValue;
                propCollection[propData.key] = _options.isV1Format ? propData : propValue;
            }
            return propCollection;
        }, {});
    },

    toLeanObject: function (options) {
        return this.toObject(_.defaults({isV1Format: false}, options));
    },

    toQuery: function (metaProps) {
        var props = this.toObject();
        var animalQuery;

        // merge metaProps if passed in
        if (metaProps) {
            props = Object.keys(metaProps).reduce(function (mergedProps, propName) {
                mergedProps[propName] = metaProps[propName];
                return mergedProps;
            }, props)
        }

        animalQuery = new AnimalQuery(props, this);

        return animalQuery.toMongoQuery();
    }
};

_.defaults(Animal.prototype, Species.prototype);

module.exports = Animal;