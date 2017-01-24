var _ = require('lodash'),

    AnimalQuery = require('./query'),
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

    getId: function(){
        return this.getValue('id')
    },

    getSpeciesName: function(){
        return this.getValue('species')
    },

    getName: function(){
        return this.getValue('name')
    },

    setValue: function (propName, propValue) {
        var prop;
        if (propValue.val === undefined) {
            prop = this.getProp(propName) || {key: propName};
            prop.val = propValue;
        } else {
            // v1
            prop = this.getProp(propName) || propValue;
            prop.val = propValue.val;
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
                            propData.val = /y|yes/i.test(propData.val)
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
                propCollection[propData.key] = (_options.isV1Format) ? propData : propValue;
            }
            return propCollection;
        }, {});
    },

    toLeanObject: function (options) {
        return this.toObject(_.defaults({isV1Format: false}, options));
    },

    toQuery: function (metaProps) {
        var props = metaProps ? Object.keys(metaProps).reduce(function (mergedProps, propName) {
                    mergedProps[propName] = metaProps[propName];
                    return mergedProps;
                }, this.toObject()) : this.toObject(),
            animalQuery = new AnimalQuery(props, this);
        return animalQuery.toMongoQuery();
    }
};

_.defaults(Animal.prototype, Species.prototype);

module.exports = Animal;