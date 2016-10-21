var fs = require('fs'),
    path = require('path'),
    util = require('util'),

    mongoose = require('mongoose'),
    _ = require('lodash'),

    ModelFactory = require('./model-factory'),
    speciesSchema = require('../schemas/species'),
    Debuggable = require('../../lib/debuggable/index');

/**
 *
 * @extends ModelFactory
 * @class SpeciesModelFactory
 * @param {String} modelName
 * @param {Object} [options]
 * @param {Object} [options.debugLevel]
 * @param {String} [options.debugTag]
 * @param {Object} [options.propSchema]
 * @returns {SpeciesModelFactory}
 * @constructor
 */
function SpeciesModelFactory(modelName, options) {

    var self = this,
        _options = _.defaults(options, {
            debugLevel: Debuggable.PROD,
            debugTag: 'SpeciesModelFactory: '
        });

    this.setDebugLevel(_options.debugLevel);
    this.setDebugTag(_options.debugTag);

    this.setModelName(modelName);
    this.setSchema(speciesSchema);

    this.log(Debuggable.HIGH, 'Set mongoose species model name to ', this.getModelName());

    this.addMiddleware('pre', 'save', function (next) {
        this.timestamp = new Date();
        this.json = JSON.stringify(self._autofillSpeciesData(JSON.parse(this.json)));
        next();
    });

    this.addMiddleware('post', 'save', function (model) {
        model._doc.responseFormat = self._generateResponse(model._doc);
    });

    this.addMiddleware('post', 'findOne', function (doc) {
        if (doc) doc.responseFormat = self._generateResponse(doc);
    });

    /**
     * @callback DBCallback
     * @param err
     * @param result
     */

    /**
     * @method getLatest
     * @memberOf! SpeciesModelFactory#
     * @param {DBCallback}
     */
    this.addStaticMethod('getLatest', function (callback) {
        self.log(Debuggable.MED, 'getting latest species model for %s', self.getModelName());

        this.model(self.getModelName()).findOne({})
            .lean()
            .sort({
                timestamp: -1
            })
            .exec(callback)
    });

    return this;
}

SpeciesModelFactory.prototype = {
    _autofillSpeciesData : function(props){
        var requiredProps = [
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
                defaultVal: '',
                description: 'Species of the animal',
                note: '',
                required: 'Yes',
                options: []
            }
        ];

        _.forEach(requiredProps, function(requiredPropData){
            var newRequiredProp = _.find(props, {key: requiredPropData.key});
            if (!newRequiredProp) props.push(requiredPropData);
        });
        return props;
    },

    _generateResponse: function (doc) {
        if (!doc.json) {
            this.error('doc.json: %s', this.dump(doc));
            return [];
            // throw new Error('doc.json not defined');
        }
        var speciesDoc = (doc.toObject) ? doc.toObject() : doc,
            speciesDocData = JSON.parse(speciesDoc.json);

        // debugger;
        // fix for bad default values
        _.forEach(speciesDocData, function (speciesPropData) {
            if (speciesPropData.valType == 'Location' && !_.isNumber(speciesPropData.defaultVal)) {
                speciesPropData.defaultVal = -1;
            }
            delete speciesPropData.val;
            if (speciesPropData.options) {
                speciesPropData.options = _.chain(speciesPropData.options)
                    .uniq()
                    .sortBy(function(option){return option})
                    .value()
            }
        });

        speciesDocData =  _.sortBy(speciesDocData, function (propData) {
            if (propData.key == 'petId') return '0';
            if (propData.key == 'images') return '1';
            if (propData.key == 'petName') return '2';
            if (propData.key == 'species') return '3';
            return propData.key;
        });

        return speciesDocData;
    }

};

_.extend(SpeciesModelFactory.prototype, ModelFactory.prototype);

module.exports = SpeciesModelFactory;
