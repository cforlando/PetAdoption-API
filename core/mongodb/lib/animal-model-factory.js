var util = require('util'),

    _ = require('lodash'),
    mongoose = require("mongoose"),

    QueryFactory = require('./animal-query-factory'),
    ModelFactory = require('./model-factory'),
    Debuggable = require('../../lib/debuggable/index'),

    Prop = QueryFactory.Prop;
/**
 *
 * @extends ModelFactory
 * @class AnimalModelFactory
 * @param {String} modelName
 * @param {Object} speciesProps
 * @param {Object} [options]
 * @param {Object} [options.debugLevel]
 * @param {String} [options.debugTag]
 * @returns {AnimalModelFactory}
 * @constructor
 */
function AnimalModelFactory(modelName, speciesProps, options) {
    var self = this,
        _options = _.defaults(options, {
            debugLevel: Debuggable.PROD,
            debugTag: 'AnimalModel: '
        });

    this.setDebugLevel(_options.debugLevel);
    this.setDebugTag(_options.debugTag);
    this.setModelName(modelName);
    this.log(Debuggable.HIGH, 'Set mongoose animal model name to ', this.getModelName());
    this.setSpeciesProps(speciesProps);

    _.forEach(this.speciesProps, function (propData) {
        self.addSchemaProp(propData.key, self.getPropValueSchemaType(propData.key));
    });

    this.addMiddleware('post', 'save', function (doc, next) {
        // TODO this never gets called
        if (!doc.petId) {
            doc.petId = doc._id.toString();
            self.log(Debuggable.LOW, 'post.save - updating petId');
            this.save(doc, function (err) {
                next(err);
            });
        } else {
            self.log(Debuggable.LOW, 'post.save - setting responseFormat');
            doc.responseFormat = self._generateResponse.call(self, doc, this.options);
            next();
        }
    });

    this.addMiddleware('post', 'findOneAndUpdate', function (doc) {
        self.log(Debuggable.LOW, 'post.save - updating petId');
        doc.petId = doc._id.toString();
        self.log(Debuggable.LOW, 'post.findOneAndUpdate - setting responseFormat');
        doc.responseFormat = self._generateResponse.call(self, doc, this.options);
    });

    this.addMiddleware('post', 'find', function (doc) {
        self.log(Debuggable.LOW, 'post.find - setting responseFormat');
        doc.responseFormat = self._generateResponseArray.call(self, doc, this.options);
        self.log(Debuggable.LOW, 'post.find - responseFormat has %s entries', doc.responseFormat.length);
    });

    this.addMethod('generateResponseData', function () {
        return self._generateResponse.call(self, this.toObject(), this.options)
    });

    this.addMethod('upsert', function (searchProps, options, callback) {
        var hasOptions = _.isPlainObject(options),
            _options = _.defaults(hasOptions ? options : {}, {
                upsert: true,
                new: true
            }),
            onComplete = (hasOptions) ? callback : options,
            upsertQueryFactory = new QueryFactory(self.getSpeciesProps(), searchProps, {
                debugLevel: self.getDebugLevel()
            }),
            doc = this,
            model = this.model(self.getModelName()),
            saveData = _.omit(doc.toObject(), ['_id']);

        self.log(Debuggable.LOW, 'upsert() w/ options %s', self.dump(_options));
        self.log(Debuggable.HIGH, 'upsert(%s) w/ options %s @ %s', self.dump(saveData), self.dump(_options), self.dump(upsertQueryFactory.build()));

        model.findOneAndUpdate(upsertQueryFactory.build(), saveData, _options)
            .lean()
            .exec(function (err, animal) {
                if (err) {
                    self.error(err);
                    onComplete(err);
                } else if (!animal) {
                    doc.save(function (err, newAnimal) {
                        self.log(Debuggable.LOW, 'created new animal: %s', newAnimal._id);
                        self.log(Debuggable.HIGH, 'updated newAnimal: %s to %s', newAnimal._id, newAnimal.responseFormat);
                        onComplete(err, newAnimal);
                    })
                } else {
                    self.log(Debuggable.LOW, 'updated animal: %s', animal._id);
                    self.log(Debuggable.HIGH, 'updated animal: %s to %s', animal._id, self.dump(animal.responseFormat));
                    onComplete(null, animal);
                }
            })
    });

    this.addStaticMethod('findAnimals', function (props, options, callback) {
        self.log(Debuggable.MED, 'Received query for %s', self.dump(props));
        var hasOptions = _.isPlainObject(options),
            _options = hasOptions ? _.defaults(options, {}) : {},
            onComplete = (hasOptions) ? callback : options,
            queryFactory = new QueryFactory(self.getSpeciesProps(), props, {
                debugLevel: self.getDebugLevel()
            });
        self.log(Debuggable.MED, 'findAnimals() executed');
        self.log(Debuggable.TMI, 'findAnimals() executed as: %s', self.dump());

        this.model(self.getModelName())
            .find(queryFactory.build(), null, _options)
            .lean()
            .exec(function (err, animals) {
                self.log(Debuggable.MED, 'findAnimals() returned');
                if (err) {
                    self.error(err);
                    onComplete(err);
                } else {
                    self.log(Debuggable.MED, 'findAnimals() - found %s', animals.length);
                    self.log(Debuggable.MED, 'findAnimals() - found %s (formatted)', animals.responseFormat.length);
                    self.log(Debuggable.TMI, 'findAnimals() - found animals (preformatted): ', animals);
                    onComplete(err, animals);
                }
            })
    });

    return this;
}

AnimalModelFactory.prototype = {

    _generateResponse: function (doc, options) {
        this.log(Debuggable.MED, '_generateResponse()');
        this.log(Debuggable.TMI, 'generating response for %s', this.dump(doc));

        // find always a return a doc array
        return this._formatAnimalForResponse(doc, options);
    },

    _generateResponseArray: function (doc, options) {
        var self = this;
        this.log(Debuggable.MED, '_generateResponseArray()');
        this.log(Debuggable.TMI, 'generating response for %s', this.dump(doc));

        // find always a return a doc array
        return doc.map(function (docEntry) {
            return self._formatAnimalForResponse(docEntry, options);
        })
    },

    _formatAnimalForResponse: function (animal, options) {

        var self = this,
            animalData = (animal.toObject) ? animal.toObject() : animal,
            _options = _.defaults(options, {
                isV1Format: true
            });
        this.log(Debuggable.HIGH, "_formatAnimalForResponse() - formatting %s", self.getSpeciesProps());
        this.log(Debuggable.TMI, "_formatAnimalForResponse() - formatting %s with: %s", animal, this.dump(this.getSpeciesProps()));


        var formattedAnimalData = _.reduce(self.getSpeciesProps(), function (propCollection, speciesPropData) {
            var propValue = animalData[speciesPropData.key];
            self.log(Debuggable.HIGH, "parsing prop '%s' for response", speciesPropData.key);
            switch (speciesPropData.key) {
                case '_id':
                case '__v':
                    // skip internal mongodb fields
                    return propCollection;
                    break;
                case 'petId':
                    propValue = animalData._id;
                    break;
                default:
                    break;
            }
            if (propValue != undefined || propValue != null) {
                var propData = _.defaults({val: propValue}, self.getSpeciesProp(speciesPropData.key)),
                    prop = new Prop(self.getSpeciesProps(), propData);
                propCollection[speciesPropData.key] = (_options.isV1Format) ? prop.getV1Format() : prop.getV2Format();
            }
            return propCollection;
        }, {});


        return formattedAnimalData;
    },

    /**
     *
     * @param propName
     * @returns {Function|Function[]} A valid Schema Type
     */
    getPropValueSchemaType: function (propName) {
        var propData = this.getSpeciesProp(propName);
        if (!propData) {
            // this.warn("getPropValueSchemaType(%s) - yielded no data", propName);
            this.warn("getPropValueSchemaType(%s) - yielded no data from %s", propName, this.dump(this.getSpeciesProps()));
            this.trace("getPropValueSchemaType(%s)", propName);
            return mongoose.Schema.Types.Mixed;
        } // return false for invalid prop names
        var propType = propData.valType;


        switch (propType) {
            case '[Image]':
                return [String];
            case 'Location':
            case 'Number':
            case 'Integer':
                if (propName == 'petId') {
                    return String;
                } else if (/(Lat|Lon)$/.test(propName)) {
                    // TODO restructure for locations
                    return Number;
                } else {
                    return Number
                }
            case 'Date':
                return Date;
            case 'Boolean':
                return Boolean;
            default:
                return String;
        }
    },

    setSpeciesProps: function (props) {
        // manually set petId if not already set
        var speciesPetIdProp = _.find(props, {key: 'petId'});
        if (!speciesPetIdProp) {
            this.speciesProps = [{
                description: 'auto generated',
                defaultVal: '',
                example: 'auto_generated',
                key: 'petId',
                note: 'auto generated',
                valType: 'String'
            }].concat(props);
        } else {
            this.speciesProps = props;
        }
    },

    getSpeciesProps: function () {
        return this.speciesProps;
    },

    getSpeciesProp: function (propName) {
        return _.find(this.speciesProps, {key: propName});
    }
};

_.defaults(AnimalModelFactory.prototype, ModelFactory.prototype);

module.exports = AnimalModelFactory;
