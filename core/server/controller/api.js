var fs = require('fs');
var path = require('path');
var url = require('url');
var util = require('util');
var stream = require('stream');

var _ = require('lodash');
var async = require('async');
var multer = require('multer');
var sharp = require('sharp');

var config = require('../../config');
var S3Bucket = require('../../s3');
var DbFormatter = require('../utils/formatter');
var CSVImporter = require('../../csv-importer');

/**
 * @class APIController
 * @param {MongoAPIDatabase} [database]
 * @param {Object} [options]
 * @param {Number} [options.pageSize]
 * @param {Number} [options.maxImageHeight]
 * @param {Object} [options.paths]
 * @param {String} [options.paths.localRoot]
 * @param {String} [options.paths.images]
 * @param {String} [options.paths.placeholders]
 * @constructor
 */
function APIController(database, options) {
    this.database = this.database || database; // inherit database if already defined
    this._apiOptions = _.defaults(options, {
        pageSize: 10,
        maxImageHeight: 1080,
        paths: {
            localRoot: path.resolve(process.cwd(), 'public/'),
            images: 'images/pet/',
            placeholders: 'images/placeholders/'
        }
    });

    this.s3 = new S3Bucket(config.DEVELOPMENT_ENV ? config.S3_DEV_BUCKET_NAME : config.S3_PROD_BUCKET_NAME);
    this.storage = multer.memoryStorage();

    this.uploader = multer({storage: this.storage});
    return this;
}

APIController.prototype = {

    getSpeciesList: function () {
        return this.database.getSpeciesList()
    },

    onUserUpdate: function () {
        var self = this;
        return function (req, res, next) {
            if (!req.body.id) {
                var unauthorizedErr = new Error('User id not provided');
                unauthorizedErr.code = 400;
                next(unauthorizedErr);
                return;
            }

            self.database.saveUser(req.body)
                .then(function (user) {
                    res.locals.simplifiedFormat = false;
                    res.locals.data = user;
                    next();
                })
                .catch(next);
        }
    },

    onUserRetrieve: function () {
        var self = this;
        return function (req, res, next) {
            var userId = req.user && req.user.id;


            if (!userId) {
                if (process.env.DEVELOPMENT_ENV) {
                    res.locals.data = {
                        id: 'dev',
                        defaults: [],
                        meta: []
                    };
                    next();
                    return;
                }

                next(Object.assign(new Error('Unauthorized'), {status: 401}));
                return;
            }

            self.database.findUser({id: userId})
                .then(function (user) {

                    res.locals.simplifiedFormat = false;
                    res.locals.data = user;

                    next();
                })
                .catch(next);
        }
    },

    onSpeciesListRequest: function () {
        var self = this;
        return function (req, res, next) {
            self.database.getSpeciesList()
                .then(function (speciesList) {
                    res.json(speciesList);
                })
                .catch(next);
        }
    },

    onListSpeciesRequest: function () {
        var self = this;

        return function (req, res, next) {

            res.locals.pageNumber = req.params['pageNumber'];

            self.database.findAnimals({species: req.params.species})
                .then(function (animals) {

                    res.locals.data = [];

                    if (_.isArray(animals)) {
                        res.locals.data = animals;
                    }

                    next();
                })
                .catch(next);
        }
    },

    onListAllRequest: function () {
        var self = this;

        return function (req, res, next) {
            res.locals.pageNumber = req.params['pageNumber'];

            self.database.findAnimals({})
                .then(function (animals) {

                    res.locals.data = animals || [];

                    next();
                })
                .catch(next);
        }
    },

    onQueryRequest: function () {
        var self = this;
        return function (req, res, next) {
            var queryData = req.body;

            res.locals.pageNumber = req.params['pageNumber'];

            self.database.findAnimals(queryData)
                .then(function (animals) {

                    res.locals.data = [];

                    if (animals && animals.length > 0) {
                        res.locals.data = animals;
                    }

                    next();
                })
                .catch(next);

        }
    },

    onOptionsRequest: function () {
        var self = this;

        return function (req, res, next) {
            var species = req.params.species;

            self.database.findSpecies(species)
                .then(function (speciesData) {

                    res.locals.simplifiedFormat = false;
                    res.locals.data = _.reduce(speciesData.props, function (collection, propData) {
                        if (propData) collection[propData.key] = propData.options;
                        return collection;
                    }, {});

                    next();
                })
                .catch(next);
        }
    },

    onSingleOptionRequest: function () {
        var self = this;

        return function (req, res, next) {
            var species = req.params.species;
            var optionName = req.params.option;

            self.database.findSpecies(species)
                .then(function (speciesData) {
                    var speciesPropData;

                    speciesPropData = _.find(speciesData.props, {key: optionName});
                    res.locals.simplifiedFormat = false;
                    res.locals.data = (speciesPropData) ? speciesPropData.options : [];

                    next();
                })
                .catch(next);
        }
    },

    onRetrieveSpecies: function () {
        var self = this;

        return function (req, res, next) {

            self.database.findSpecies(req.params.species)
                .then(function (speciesData) {

                    res.locals.simplifiedFormat = false;
                    res.locals.data = speciesData.props;

                    next();
                })
                .catch(next);
        }
    },

    onDeleteAnimal: function () {
        var self = this;
        return function (req, res, next) {

            self.database.removeAnimal(req.params.species, req.body)
                .then(function (result) {
                    res.json(result)
                })
                .catch(next);
        }
    },

    onSaveAnimalJSON: function () {
        var self = this;
        return function (req, res, next) {

            self.database.saveAnimal(req.params.species, req.body)
                .then(function (newAnimal) {
                    res.locals.simplifiedFormat = false;
                    res.locals.data = newAnimal;
                    next();
                })
                .catch(next);
        }
    },

    saveSpeciesPlaceHolder: function (species, fileMeta) {
        var bufferStream = new stream.PassThrough();
        var publicPath = path.join(this._apiOptions.paths.images, (species + '/'), fileMeta.originalname);
        var imageFormatter = sharp()
            .resize(null, this._apiOptions.maxImageHeight)
            .withoutEnlargement();
        var formattedBufferStream = bufferStream.pipe(imageFormatter);

        bufferStream.end(fileMeta.buffer);

        return this.s3.saveReadableStream(formattedBufferStream, publicPath)
            .then(function (result) {
                return Promise.resolve(result.Location);
            });
    },


    onSaveAnimalForm: function () {
        var self = this;
        return function (req, res, next) {
            var animalData = req.body;
            var imagesValue = animalData.images || '';
            var saveImageOps = req.files.map(function (fileMeta) {
                return self.saveSpeciesPlaceHolder(req.params.species, fileMeta)
            });

            Promise.all(saveImageOps)
                .then(function (newImageUrls) {

                    animalData.images = _.chain(newImageUrls)
                        .concat(imagesValue.split(','))
                        .reject(function (url) {
                            // only truthy values
                            return !url;
                        })
                        .value();

                    return self.database.saveAnimal(req.params.species, animalData)
                })
                .then(function (newAnimal) {
                    res.locals.simplifiedFormat = false;
                    res.locals.data = newAnimal;

                    next()
                })
                .catch(next)
        }
    },

    onSaveSpecies: function () {
        var self = this;

        return function (req, res, next) {
            self.database.saveSpecies(req.params.species, req.body)
                .then(function (updatedSpecies) {

                    res.locals.simplifiedFormat = false;
                    res.locals.data = updatedSpecies;

                    next();
                })
                .catch(next);
        }
    },

    onSaveSpeciesPlaceholder: function () {
        var self = this;
        return function (req, res, next) {
            var species = req.params.species,
                bufferStream = new stream.PassThrough(),
                publicPath = path.join(self._apiOptions.paths.placeholders, species + '.png');
            // TODO determine and use proper file extension

            bufferStream.end(req.file.buffer);

            var imageFormatter = sharp()
                .resize(null, self._apiOptions.maxImageHeight)
                .withoutEnlargement();

            var formattedBufferStream = bufferStream.pipe(imageFormatter);

            self.s3.saveReadableStream(formattedBufferStream, publicPath)
                .then(function (result) {
                    res.json({result: "success", location: result.Location});
                })
                .catch(next);
        }
    },

    onCreateSpecies: function () {
        var self = this;

        return function (req, res, next) {
            self.database.saveSpecies(req.params.species, req.body)
                .then(function (newSpecies) {
                    res.locals.simplifiedFormat = false;
                    res.locals.data = newSpecies;

                    next();
                })
                .catch(next)
        }
    },

    onDeleteSpecies: function () {
        var self = this;

        return function (req, res, next) {
            self.database.deleteSpecies(req.params.species)
                .then(function () {
                    res.json({result: 'success'})
                })
                .catch(next);
        }
    },

    onFormatDb: function () {
        var self = this;

        return function (req, res, next) {
            var dbFormatter = new DbFormatter();

            dbFormatter.formatDb(self.database)
                .then(function () {
                    res.send({result: 'success'})
                })
                .catch(next)
        }
    },

    onReset: function () {
        var self = this;
        var csvImporter = new CSVImporter();

        return function (req, res, next) {

            self.database.clearAnimals()
                .then(function () {
                    return csvImporter.run()
                })
                .then(function (pets) {

                    self.log('dataset parsed');

                    return Promise.all(pets.map(function (petData, idx) {
                        self.log('parsing %s/%s', idx + 1, pets.length);
                        return self.database.saveAnimal(petData.species || 'dog', petData)
                            .catch(function (err) {
                                console.error(err);
                            });
                    }))

                })
                .then(function () {
                    // execute db formatting as well
                    return self.onFormatDb()(req, res, next);
                })
                .catch(function (err) {
                    next(err);
                });
        }
    }

};

module.exports = APIController;
