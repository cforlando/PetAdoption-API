var _ = require('lodash'),

    Debuggable = require('./debuggable'),
    Species = require('./species');

function Animal(species) {
    Species.apply(species.getName(), species.getProps());
}

Animal.prototype = {

    setProps: function (props) {
        if (props) {
            this.props = _.chain(props)
                .concat(this.props)
                .map(function (propData) {
                    return _.isPlainObject(propData) ? propData : {val: propData}
                })
                .uniqBy(function (propData) {
                    return propData.key
                })
                .value();
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
                case '__v': // skip internal mongodb fields return propCollection;
                    break;
                case 'petId':
                    propData.val = self.props.getProp('_id').val;
                    break;
                default:
                    break;
            }
            if (propValue != undefined || propValue != null) {
                propCollection[propData.key] = (_options.isV1Format) ? propData : propData.val;
            }
            return propCollection;
        }, {});
    },

    toArray: function () {
        return this.props;
    }
};

_.extend(Animal.prototype, Species.prototype);

module.exports = Animal;