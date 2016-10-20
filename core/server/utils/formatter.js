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
 * @param {MongoAPIDatabase} database
 * @param {SpeciesDBImage[]} dbConfigurations
 * @param {Object} [options]
 * @param {Boolean} [options.createMissingFields=false]
 * @param {Boolean} [options.populateEmptyFields=false]
 * @constructor
 */
function DataFormatter(database, dbConfigurations, options) {
    var self = this,
        _options = _.defaults(options, {
            debugTag: 'DataFormatter: ',
            debugLevel: Debuggable.PROD,
            createMissingFields: false,
            populateEmptyFields: false
        });

    this.setDebugLevel(_options.debugLevel);
    this.setDebugTag(_options.debugTag);
    /**
     *
     * @param options
     * @param {String} [options.species='cat']
     * @param {Function} options.complete
     */
    this.formatDB = function (options) {
        var _options = _.defaults(options, {species: 'cat'}),
            queryData = {species: _options.species},
            updatedAnimal;

        database.findAnimals(queryData, {
            debugLevel: _options.debugLevel,
            complete: function (err, animals) {
                async.each(animals, function each(animal, done) {
                    if (animal) {
                        updatedAnimal = self.formatAnimal(animal);
                        self._saveAnimal(updatedAnimal, {
                            complete: function () {
                                done();
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
    };

    this._pickRandomOption = function (options) {
        if (options && options.length > 0) {
            var randOptionIndex = Math.floor(Math.random() * options.length);
            return options[randOptionIndex]
        }
        return false;
    };

    this._saveAnimal = function (animalProps, options) {
        var _options = _.defaults(options, {}),
            reducedAnimalProps = _.reduce(animalProps, function (collection, propData, propName) {
                collection[propName] = propData.val;
                return collection;
            }, {});

        this.log(Debuggable.PROD, 'saving %j', reducedAnimalProps);

        database.saveAnimal(reducedAnimalProps.species, reducedAnimalProps, {
            debugLevel: _options.debugLevel,
            complete: function (err, newAnimal) {
                if (err) console.error(err);
                if (_options.complete) _options.complete.apply(_options.context, [null, newAnimal])
            }
        });
    };

    this.formatAnimal = function (animalProps) {
        var self = this,
            species = animalProps.species.val || self._pickRandomOption(['dog', 'cat']),
            dbConfig = _.find(dbConfigurations, function (dbConfig) {
                return species == dbConfig.getSpeciesName();
            });
        this.log(Debuggable.PROD, 'formatting a %s', species);
        _.forEach(dbConfig.getSpeciesProps(), function (propData) {
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
                    if (_options.populateEmptyFields && _.isUndefined(animalProps[propData.key].val)) {
                        // chose a random value for a field
                        animalProps[propData.key].val = self._pickRandomOption(propData.options) || animalProps[propData.key].val || propData.example || propData.defaultVal;
                    }
            }
        });
        return animalProps;
    };

    this.formatImagesArray = function (imagesArr, options) {
        var _options = _.defaults({species: 'dog'}, options);
        this.log(Debuggable.LOW, "formatting %s images", imagesArr.length);

        return imagesArr.map(function formatImgURL(imageURL) {
            var fileBaseName = path.basename(imageURL),
                relativeImagePath = util.format('/images/pet/%s/', _options.species);
            return url.resolve(config.domain, path.join(relativeImagePath, fileBaseName));
        });
    };

    return this;
}

DataFormatter.prototype = new Debuggable();


module.exports = DataFormatter;
