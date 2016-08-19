var util = require('util'),
    fs = require('fs'),
    path = require('path'),
    url = require('url'),

    async = require('async'),
    _ = require('lodash'),

    config = require('../../config'),
    database = require('../../database');

/**
 *
 * @param {Object} [options]
 * @param {Boolean} [options.createMissingFields=false]
 * @param {Boolean} [options.populateEmptyFields=false]
 * @constructor
 */
function ModelFormatter(options) {
    var self = this,
        cachedModels = (function () {
            try {
                return JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'data/models.json'), {encoding: 'utf8'}));
            } catch (err) {
                console.log(err);
                return {};
            }
        })(),
        formatterOptions = _.defaults(options, {
            createMissingFields : false,
            populateEmptyFields : false
        });

    /**
     *
     * @param options
     * @param options.complete
     */
    this.formatDB = function (options) {
        var _options = _.defaults(options, {species: 'cat'}),
            queryData = {species: _options.species},
            updatedAnimal;

        database.findAnimals(queryData, {
            debug: config.debugLevel,
            complete: function (err, animals) {
                async.each(animals, function each(animal, done) {
                    updatedAnimal = self.formatAnimal(animal);
                    self._saveAnimal(updatedAnimal, {
                        complete: function () {
                            done();
                        }
                    });
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
            reducedModel = {};

        _.forEach(animalProps, function (propData, propName) {
            reducedModel[propName] = propData.val;
        });

        console.log('saving %j', reducedModel);

        database.saveAnimal(reducedModel.species, reducedModel, {
            debug: config.debugLevel,
            complete: function (err, newAnimal) {
                if (_options.complete) _options.complete.apply(_options.context, [null, newAnimal])
            }
        });
    };

    this.formatAnimal = function (animalProps) {
        var self = this,
            species = animalProps.species.val || self._pickRandomOption(['dog', 'cat']);
        console.log('formatting a %s', species);
        _.forEach(cachedModels[species], function (propData, propName) {
            switch (propName) {
                case 'images':
                    var images = (animalProps[propName] && _.isArray(animalProps[propName].val)) ? animalProps[propName].val : (propData.defaultVal || propData.example);
                    propData.val = self.formatImagesArray(images, {species: species});
                    animalProps[propName] = propData;
                    break;
                case 'species':
                    animalProps[propName] = _.defaults( {val: species}, animalProps[propName] || propData);
                    break;
                default:
                    if (formatterOptions.createMissingFields){
                        // assign values for all possible fields
                        animalProps[propName] = _.defaults(animalProps[propName], propData);
                    } else if (animalProps[propName]) {
                        // assign values for only currently assigned fields
                        _.defaults(animalProps[propName], propData)
                    }
                    if (formatterOptions.populateEmptyFields && _.isUndefined(animalProps[propName].val)) {
                        // chose a random value for a field
                        animalProps[propName].val = self._pickRandomOption(propData.options) || animalProps[propName].val || propData.example || propData.defaultVal;
                    }
            }
        });
        return animalProps;
    };

    this.formatImagesArray = function (imagesArr, options) {
        var _options = _.defaults({species : 'dog'}, options);
        console.log("formatting %s images", imagesArr.length);
        function formatImgURL(imageURL) {
            var fileBaseName = path.basename(imageURL),
                relativeImagePath = util.format('/images/pet/%s/', _options.species);
            return url.resolve(config.domain, path.join(relativeImagePath, fileBaseName));
        }

        return imagesArr.map(formatImgURL);
    };
};


module.exports = new ModelFormatter();
