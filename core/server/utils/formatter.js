var util = require('util');
var path = require('path');
var url = require('url');

var async = require('async');
var _ = require('lodash');
var log = require('debug')('pet-api:formatter');

var Species = require('../../lib/species');
var config = require('../../config');

/**
 *
 * @class DataFormatter
 * @param {Object} [options]
 * @param {Boolean} [options.createMissingFields=false]
 * @param {Boolean} [options.populateEmptyFields=false]
 * @constructor
 */
function DataFormatter(options) {
    var _options = _.defaults(options, {
        createMissingFields: false,
        populateEmptyFields: false
    });

    this._config = _options;
    this.speciesCache = {};
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
     * @returns {Promise}
     */
    _saveAnimal: function (database, animalProps, options) {
        var _options = _.defaults(options, {});
        var reducedAnimalProps = _.reduce(animalProps, function (collection, propData, propName) {
            collection[propName] = propData.val;
            return collection;
        }, {});

        log('saving %j', reducedAnimalProps);

        return database.saveAnimal(reducedAnimalProps.species, reducedAnimalProps);
    },


    /**
     *
     * @param {MongoAPIDatabase} database
     * @param {Object} [options]
     * @param {Boolean} [options.createMissingFields=false]
     * @param {Boolean} [options.populateEmptyFields=false]
     * @returns {Promise}
     */
    formatDb: function (database, options) {
        var self = this,
            _options = _.defaults(options, this._config);

        return database.getSpeciesList()
            .then(function (speciesList) {
                // get list of species
                return new Promise(function (resolve, reject) {
                    async.eachSeries(speciesList,
                        function each(speciesName, onSpeciesFetched) {
                            // save each species data to speciesCache
                            database.findSpecies(speciesName)
                                .then(function (speciesData) {
                                    self.speciesCache[speciesName] = new Species(speciesName, speciesData.props);
                                    onSpeciesFetched()
                                })
                                .catch(onSpeciesFetched)
                        },
                        function complete(err) {
                            if (err) {
                                reject(err);
                                return;
                            }

                            resolve();
                        })
                });
            })
            .then(function () {
                // find all animals
                return database.findAnimals({})
            })
            .then(function (animals) {

                // format each animal
                return Promise.all(animals.map(function each(animalProps, index, onAnimalFormatted) {
                    var species = self.speciesCache[animalProps.species.val];
                    var formattedAnimalProps;

                    if (!species) {
                        console.error(new Error('Could not save animal @ idx:' + index));
                        return Promise.resolve();
                    }

                    // format if species found in cache
                    formattedAnimalProps = self.formatAnimal(species.getSpeciesProps(), animalProps, {
                        createMissingFields: _options.createMissingFields,
                        populateEmptyFields: _options.populateEmptyFields
                    });

                    // save formatted animal
                    return self._saveAnimal(database, formattedAnimalProps, {species: species});

                }))
            })
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

        log('formatting a %s', species);
        _.forEach(speciesProps, function (speciesPropData) {
            switch (speciesPropData.key) {
                case 'petId':
                    animalProps[speciesPropData.key] = _.defaults({
                        val: animalProps[speciesPropData.key] ? animalProps[speciesPropData.key].val : null
                    }, speciesPropData);
                    break;
                case 'images':
                    var images = (animalProps[speciesPropData.key] && _.isArray(animalProps[speciesPropData.key].val)) ? animalProps[speciesPropData.key].val : (speciesPropData.defaultVal || speciesPropData.example);
                    speciesPropData.val = self.formatImagesArray(images, {species: species});
                    animalProps[speciesPropData.key] = speciesPropData;
                    break;
                case 'species':
                    animalProps[speciesPropData.key] = _.defaults({val: species}, animalProps[speciesPropData.key] || speciesPropData);
                    break;
                default:
                    if (_options.createMissingFields) {
                        // assign values for all possible fields
                        animalProps[speciesPropData.key] = _.defaults(animalProps[speciesPropData.key], speciesPropData);
                    } else if (animalProps[speciesPropData.key]) {
                        // assign values for only currently assigned fields
                        animalProps[speciesPropData.key] = _.defaults(animalProps[speciesPropData.key], speciesPropData);
                    }

                    if (_options.populateEmptyFields && animalProps[speciesPropData.key] && _.isUndefined(animalProps[speciesPropData.key].val)) {
                        // chose a random value for a field
                        animalProps[speciesPropData.key].val = self._pickRandomOption(speciesPropData.options) || animalProps[speciesPropData.key].val || speciesPropData.example || speciesPropData.defaultVal;
                    }
            }
        });
        return animalProps;
    },

    formatImagesArray: function (imagesArr, options) {
        var _options = _.defaults({species: 'dog'}, options);
        log("formatting %s images", imagesArr.length);

        return imagesArr.map(function formatImgURL(imageURL) {
            var fileBaseName = path.basename(imageURL),
                relativeImagePath = util.format('/images/pet/%s/', _options.species);
            return url.resolve(config.ASSETS_DOMAIN, path.join(relativeImagePath, fileBaseName));
        });
    }
};

module.exports = DataFormatter;
