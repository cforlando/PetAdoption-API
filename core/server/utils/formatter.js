var util = require('util'),
    fs = require('fs'),
    path = require('path'),
    url = require('url'),

    async = require('async'),
    _ = require('lodash'),

    Debuggable = require('../../lib/debuggable'),
    config = require('../../config');

/**
 *
 * @extends Debuggable
 * @class DataFormatter
 * @param {Object} [options]
 * @param {Boolean} [options.createMissingFields=false]
 * @param {Boolean} [options.populateEmptyFields=false]
 * @constructor
 */
function DataFormatter(options) {
    var _options = _.defaults(options, {
        debugTag: 'DataFormatter: ',
        debugLevel: Debuggable.PROD,
        createMissingFields: false,
        populateEmptyFields: false
    });

    this.setDebugLevel(_options.debugLevel);
    this.setDebugTag(_options.debugTag);

    this._config = _options;
}

DataFormatter.prototype = {


    /**
     *
     * @param {*[]} options
     * @returns {*}
     */
    _pickRandomOption: function (options) {
        if (options && options.length > 0) {
            var randOptionIndex = Math.floor(Math.random() * options.length);
            return options[randOptionIndex]
        }
        return false;
    },

    /**
     *
     * @param {MongoAPIDatabase} database
     * @param {Object} animalProps
     * @param {Object} [options]
     */
    _saveAnimal: function (database, animalProps, options) {
        var _options = _.defaults(options, {}),
            reducedAnimalProps = _.reduce(animalProps, function (collection, propData, propName) {
                collection[propName] = propData.val;
                return collection;
            }, {});

        this.log(Debuggable.MED, 'saving %j', reducedAnimalProps);

        database.saveAnimal(reducedAnimalProps.species, reducedAnimalProps, {
            debugLevel: _options.debugLevel,
            complete: function (err, newAnimal) {
                if (err) console.error(err);
                if (_options.complete) _options.complete.apply(_options.context, [null, newAnimal])
            }
        });
    },


    /**
     *
     * @param {MongoAPIDatabase} database
     * @param {Object[]} speciesProps
     * @param options
     * @param {Boolean} [options.createMissingFields=false]
     * @param {Boolean} [options.populateEmptyFields=false]
     * @param {String} [options.species='cat']
     * @param {Function} options.complete
     */
    formatDB: function (database, speciesProps, options) {
        var self = this,
            _options = _.defaults(options, {
                // use example because of how data was unfortunately formatted initially
                species: _.find(speciesProps, {key: 'species'}).example.toLowerCase()
            }, this._config),
            queryData = {species: _options.species};

        database.findAnimals(queryData, {
            debugLevel: _options.debugLevel,
            complete: function (err, animals) {
                async.each(animals, function each(animal, done) {
                    if (animal) {
                        var formattedAnimalProps = self.formatAnimal(speciesProps, animal, {
                            createMissingFields: _options.createMissingFields,
                            populateEmptyFields: _options.populateEmptyFields
                        });
                        self._saveAnimal(database, formattedAnimalProps, {
                            complete: function (err) {
                                done(err);
                            }
                        });
                    } else {
                        done();
                    }
                }, function complete() {
                    if (_options.complete) _options.complete.apply(_options.context);
                });
            }
        });
    },

    /**
     *
     * @param speciesProps
     * @param animalProps
     * @param {Object} [options]
     * @param {Boolean} [options.createMissingFields=false]
     * @param {Boolean} [options.populateEmptyFields=false]
     * @returns {Object} animalProps
     */
    formatAnimal: function (speciesProps, animalProps, options) {
        var self = this,
            _options = _.defaults(options, this._config),
            // use example because of how data was unfortunately formatted initially
            species = _.find(speciesProps, {key: 'species'}).example.toLowerCase();

        this.log(Debuggable.LOW, 'formatting a %s', species);
        _.forEach(speciesProps, function (propData) {
            switch (propData.key) {
                case 'images':
                    var images = (animalProps[propData.key] && _.isArray(animalProps[propData.key].val)) ? animalProps[propData.key].val : (propData.defaultVal || propData.example);
                    propData.val = self.formatImagesArray(images, {species: species});
                    animalProps[propData.key] = propData;
                    break;
                case 'species':
                    animalProps[propData.key] = _.defaults({val: species}, animalProps[propData.key] || propData);
                    break;
                default:
                    if (_options.createMissingFields) {
                        // assign values for all possible fields
                        animalProps[propData.key] = _.defaults(animalProps[propData.key], propData);
                    } else if (animalProps[propData.key]) {
                        // assign values for only currently assigned fields
                        animalProps[propData.key] = _.defaults(animalProps[propData.key], propData);
                    }
                    if (_options.populateEmptyFields && animalProps[propData.key] && _.isUndefined(animalProps[propData.key].val)) {
                        // chose a random value for a field
                        animalProps[propData.key].val = self._pickRandomOption(propData.options) || animalProps[propData.key].val || propData.example || propData.defaultVal;
                    }
            }
        });
        return animalProps;
    },

    formatImagesArray: function (imagesArr, options) {
        var _options = _.defaults({species: 'dog'}, options);
        this.log(Debuggable.LOW, "formatting %s images", imagesArr.length);

        return imagesArr.map(function formatImgURL(imageURL) {
            var fileBaseName = path.basename(imageURL),
                relativeImagePath = util.format('/images/pet/%s/', _options.species);
            return url.resolve(config.ASSETS_DOMAIN, path.join(relativeImagePath, fileBaseName));
        });
    }
};

_.extend(DataFormatter.prototype, Debuggable.prototype);


module.exports = DataFormatter;
