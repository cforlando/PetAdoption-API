var _ = require('lodash'),

    Debuggable = require('./debuggable');

/**
 * @class Species
 * @param speciesName
 * @param props
 * @constructor
 */
function Species(speciesName, props) {
    this.name = speciesName;
    this.baseProps = [
        {
            key: 'petId',
            valType: 'String',
            fieldLabel: "Pet ID",
            example: '',
            defaultVal: [],
            description: 'identifier',
            note: '',
            required: 'Yes',
            options: []
        },
        {
            key: 'species',
            valType: 'String',
            fieldLabel: "Animal's Species",
            example: 'dog',
            defaultVal: speciesName,
            description: 'Species of the animal',
            note: '',
            required: 'Yes',
            options: [speciesName]
        },
        {
            key: 'images',
            valType: '[Image]',
            fieldLabel: "Pet images",
            example: ['http://placehold.it/500x500'],
            defaultVal: [],
            description: 'Images of the animal',
            note: '',
            required: 'No',
            options: []
        },
        {
            key: 'petName',
            valType: 'String',
            fieldLabel: "Pet's name",
            example: 'Fido',
            defaultVal: '',
            description: '',
            note: '',
            required: 'No',
            options: []
        }
    ];
    this.props = this.baseProps.slice();
    if (props) this.setProps(_.isString(props) ? JSON.parse(props) : props);
}

Species.prototype = {

    getSpeciesName: function () {
        return this.name
    },

    setProps: function (props) {
        if (props) {
            this.props = _.chain(props)
                .concat(this.props)
                .uniqBy(function (propData) {
                    return propData.key
                })
                .value()
        }
    },

    getProp: function (propName) {
        return _.find(this.props, {key: propName});
    },

    getProps: function (options) {
        var _options = _.defaults(options, {removeValues: false});
        return _.chain(this.props)
            .reduce(function (props, speciesPropData) {
                if (speciesPropData.valType == 'Location' && !_.isNumber(speciesPropData.defaultVal)) {
                    // fix for bad default values
                    speciesPropData.defaultVal = -1;
                }
                if (speciesPropData.options) {
                    speciesPropData.options = _.chain(speciesPropData.options)
                        .uniq()
                        .sortBy(function (option) {
                            return option
                        })
                        .value()
                }

                props.push(speciesPropData);
                return props
            }, [])
            .map(function (propData) {
                return (_options.removeValues) ? _.omit(propData, ['val']) : propData;
            })
            .sortBy(function (propData) {
                if (propData.key == 'petId') return '0';
                if (propData.key == 'images') return '1';
                if (propData.key == 'petName') return '2';
                if (propData.key == 'species') return '3';
                return propData.key;
            })
            .value();
    },

    getSpeciesProps: function () {
        return this.getProps({removeValues: true});
    },

    toMongooseDoc: function () {
        return {
            name: this.getSpeciesName(),
            props: this.getProps()
        }
    }
};

_.defaults(Species.prototype, Debuggable.prototype);

module.exports = Species;
