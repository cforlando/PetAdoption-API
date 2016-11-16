var _ = require('lodash'),

    Debuggable = require('./debuggable'),
    Species = require('./species');

/**
 *
 * @extends Species
 * @class Animal
 * @param species
 * @param values
 * @constructor
 */
function Animal(species, values) {
    Species.call(this, species.getName(), species.getProps());
    if (values) this.setValues(values);
}

Animal.prototype = {

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
                    var nativeIdProp = self.getProp('_id');
                    if (nativeIdProp) {
                        propData.val = nativeIdProp.val;
                    }
                    break;
                default:
                    break;
            }
            if (propValue != undefined && propValue != null) {
                propCollection[propData.key] = (_options.isV1Format) ? propData : propData.val;
            }
            return propCollection;
        }, {});
    },

    setValue: function (propName, propValue) {
        var prop = this.getProp(propName) || {key: propName};
        prop.val = propValue;
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
    }
};

_.extend(Animal.prototype, Species.prototype);

module.exports = Animal;