var _ = require('lodash'),

    Debuggable = require('./debuggable');

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
    this.props = this.baseProps;
    this.setProps(_.isString(props) ? JSON.parse(props) : props);
}

Species.prototype = {

    getName: function () {
        return this.name
    },

    setProps: function (props) {
        if (props) {
            this.props = _.chain(props)
                .concat(this.props)
                .uniqBy(function (propData) {
                    return propData.key
                })
                .value();
        }
    },

    getProp: function (propName) {
        return _.find(this.props, {key: propName});
    },

    getProps: function () {
        this.props = _.chain(this.props)
            .reduce(function (props, speciesPropData) {
                if (speciesPropData.valType == 'Location' && !_.isNumber(speciesPropData.defaultVal)) {
                    // fix for bad default values
                    speciesPropData.defaultVal = -1;
                }
                delete speciesPropData.val;
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
            .sortBy(function (propData) {
                if (propData.key == 'petId') return '0';
                if (propData.key == 'images') return '1';
                if (propData.key == 'petName') return '2';
                if (propData.key == 'species') return '3';
                return propData.key;
            })
            .value();

        return this.props;
    }
};

_.extend(Species.prototype, Debuggable.prototype);

module.exports = Species;
