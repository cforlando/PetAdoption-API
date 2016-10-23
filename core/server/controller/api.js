var fs = require('fs'),
    path = require('path'),
    url = require('url'),
    util = require('util'),

    config = require('../../config'),
    _ = require('lodash'),
    async = require('async'),
    multer = require('multer'),

    Debuggable = require('../../lib/debuggable'),
    SpeciesDBImage = require('../../mongodb/lib/species-db-image'),
    DBFormatter = require('../utils/formatter'),
    csvReader = require('../../csv-parser'),
    dump = require('../../../lib/dump');

/**
 * @extends Debuggable
 * @class APIController
 * @param {MongoAPIDatabase} [database]
 * @param {Object} [options]
 * @param {DebugLevel} [options.debugLevel=Debuggable.PROD]
 * @constructor
 */
function APIController(database, options) {
    this.setDebugTag('APIController: ');

    var self = this;

    this.database = this.database || database; // inherit database if already defined
    this._apiOptions = _.defaults(options, {
        debugLevel: Debuggable.PROD,
        pageSize: 10,
        paths: {
            root: path.resolve(process.cwd(), 'public/'),
            images: '/images/pet/'
        }
    });
    this.storage = multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, path.join(self._apiOptions.paths.root, self._apiOptions.paths.images, (req.params.species + '/')))
        },
        filename: function (req, file, cb) {
            self.log(Debuggable.LOW, 'new file: %s', dump(file));
            cb(null, file.originalname)
        }
    });

    this.upload = multer({storage: this.storage});
    this.log(Debuggable.LOW, 'APIController() = %s', this.dump());
    return this;
}

APIController.prototype = _.extend({

    getSpeciesList: function (callback) {
        this.database.getSpeciesList({
            complete: callback
        })
    },

    onUserUpdate: function () {
        var self = this;
        return function (req, res, next) {
            if (!req.body.id) {
                var unauthorizedErr = new Error('User id not provided');
                unauthorizedErr.code = 400;
                next(unauthorizedErr);
            } else {
                self.database.saveUser(req.body, {
                    complete: function (err, user) {
                        if (err) return next(err);
                        res.locals.simplifiedFormat = false;
                        res.locals.data = user;
                        next();
                    }
                })
            }
        }
    },

    onUserRetrieve: function () {
        var self = this;
        return function (req, res, next) {
            var userId = (req.session && req.session.passport && req.session.passport.user) ? req.session.passport.user : false;
            if (!userId) {
                var unauthorizedErr = new Error('Unauthorized');
                unauthorizedErr.status = 401;
                next(unauthorizedErr);
            } else {
                self.database.findUser({
                    id: userId
                }, {
                    complete: function (err, user) {
                        if (err) return next(err);
                        res.locals.simplifiedFormat = false;
                        res.locals.data = user;
                        next();
                    }
                })
            }
        }
    },

    onSpeciesListRequest: function () {
        var self = this;
        return function (req, res, next) {
            self.database.getSpeciesList({
                complete: function (err, speciesList) {
                    if (err) {
                        self.error(err);
                        next(err);
                    } else {
                        res.json(speciesList);
                    }
                }
            });
        }
    },

    onListSpeciesRequest: function () {
        var self = this;
        return function (req, res, next) {

            res.locals.pageNumber = req.params['pageNumber'];

            self.log(Debuggable.MED, 'onListRequeset()');
            self.database.findAnimals({species: req.params.species},
                {
                    debug: self._apiOptions.debugLevel,
                    complete: function (err, animals) {
                        if (err) {
                            next(err);
                        } else if (_.isArray(animals)) {
                            res.locals.data = animals;
                            next();
                        } else {
                            res.locals.data = [];
                            next();
                        }
                    }
                });
        }
    },

    onListAllRequest: function () {
        var self = this;
        return function (req, res, next) {
            var responseData = [];
            res.locals.pageNumber = req.params['pageNumber'];

            self.getSpeciesList(function (err, speciesList) {
                if (err) {
                    next(err);
                } else {
                    async.each(speciesList, function each(species, done) {
                        self.database.findAnimals({species: species}, {
                            debug: self._apiOptions.debugLevel,
                            complete: function (err, animals) {
                                if (err) {
                                    done(err);
                                } else if (_.isArray(animals)) {
                                    responseData = responseData.concat(animals);
                                    done();
                                } else {
                                    done();
                                }
                            }
                        });
                    }, function complete(err) {
                        if (err) {
                            next(err);
                        } else if (_.isArray(responseData)) {
                            res.locals.data = responseData;
                            next();
                        } else {
                            res.locals.data = [];
                            next();
                        }

                    })
                }
            });

        }
    },

    onQueryRequest: function () {
        var self = this;
        return function (req, res, next) {
            var queryData = req.body;
            res.locals.pageNumber = req.params['pageNumber'];

            self.database.findAnimals(queryData, {
                debug: self._apiOptions.debugLevel,
                complete: function (err, animals) {
                    if (err) {
                        next(err);
                    } else if (animals && animals.length > 0) {
                        res.locals.data = animals;
                        next();
                    } else {
                        res.locals.data = [];
                        next();
                    }
                }
            });

        }
    },

    onOptionsRequest: function () {
        var self = this;
        return function (req, res, next) {
            var species = req.params['species'];

            self.database.findSpecies(species, {
                complete: function (err, speciesProps) {
                    if (err) {
                        next(err);
                    } else {
                        res.locals.simplifiedFormat = false;
                        res.locals.data = _.reduce(speciesProps, function (collection, propData) {
                            if (propData) collection[propData.key] = propData.options;
                            return collection;
                        }, {});
                        next();
                    }
                }
            });
        }
    },

    onSingleOptionRequest: function () {
        var self = this;
        return function (req, res, next) {
            var species = req.params['species'],
                optionName = req.params['option'];


            self.database.findSpecies(species, {
                complete: function (err, speciesProps) {
                    if (err) {
                        next(err);
                    } else {
                        res.locals.simplifiedFormat = false;
                        var speciesPropData = _.find(speciesProps, {key: optionName});
                        res.locals.data = (speciesPropData) ? speciesPropData.options : [];
                        next();
                    }
                }
            });
        }
    },

    onRetrieveSpecies: function () {
        var self = this;
        return function (req, res, next) {

            self.database.findSpecies(req.params.species, {
                debug: self._apiOptions.debugLevel,
                complete: function (err, animalModel) {
                    if (err) {
                        next(err)
                    } else {
                        res.locals.simplifiedFormat = false;
                        res.locals.data = animalModel;
                        next();
                    }
                }
            })
        }
    },

    onDeleteSpecies: function () {
        var self = this;
        return function (req, res, next) {

            self.database.removeAnimal(
                req.params.species,
                req.body, {
                    debug: self._apiOptions.debugLevel,
                    complete: function (err, result) {
                        if (err) {
                            next(err);
                        } else {
                            res.json(result)
                        }
                    }
                })
        }
    },

    onSaveAnimalJSON: function () {
        var self = this;
        return function (req, res, next) {

            self.database.saveAnimal(
                req.params.species,
                req.body, {
                    debug: this._apiOptions.debugLevel,
                    complete: function (err, newAnimal) {
                        if (err) {
                            next(err);
                        } else {
                            res.locals.simplifiedFormat = false;
                            res.locals.data = newAnimal;
                            next();
                        }
                    }
                });
        }
    },

    onMediaSave: function () {
        var self = this;
        return function (req, res, next) {
            var props = req.body,
                imagesValue = props.images || '';

            props.images = imagesValue.split(',');

            _.forEach(req.files, function (fileMeta) {
                var publicPath = path.join(self._apiOptions.paths.images, (req.params.species + '/'), fileMeta.filename);
                props.images.push(url.resolve(config.domain, publicPath));
            });

            props.images = _.filter(props.images, function (url) {
                // only truthy values
                return !!url;
            });
            self.database.saveAnimal(
                req.params.species,
                props, {
                    debug: self._apiOptions.debugLevel,
                    complete: function (err, newAnimal) {
                        if (err) {
                            next(err);
                        } else {
                            res.locals.simplifiedFormat = false;
                            res.locals.data = newAnimal;
                            next()
                        }
                    }
                });
        }
    },

    onSaveSpecies: function () {
        var self = this;
        return function (req, res, next) {
            self.database.saveSpecies(
                req.params.species,
                req.body, {
                    debug: self._apiOptions.debugLevel,
                    complete: function (err, updatedSpecies) {
                        if (err) {
                            next(err);
                        } else {
                            res.locals.simplifiedFormat = false;
                            res.locals.data = updatedSpecies;
                            next();
                        }
                    }
                });
        }
    },

    onCreateSpecies: function () {
        var self = this;
        return function (req, res, next) {

            self.database.createSpecies(
                req.params.species,
                req.body, {
                    debug: self._apiOptions.debugLevel,
                    complete: function (err, newSpecies) {
                        if (err) {
                            next(err);
                        } else {
                            res.locals.simplifiedFormat = false;
                            res.locals.data = newSpecies;
                            next();
                        }
                    }
                });
        }
    },

    onFormatSpeciesDB: function () {
        var self = this;
        return function (req, res, next) {
            var speciesName = req.params.species;

            self.database.findSpecies(speciesName, {
                complete: function (err, speciesProps) {
                    if (err) {
                        next(err);
                    } else {
                        var dbFormatter = new DBFormatter(self.database, [new SpeciesDBImage(speciesName, [], speciesProps)]);
                        dbFormatter.formatDB({
                            species: speciesName,
                            complete: function (err) {
                                if (err) {
                                    next(err)
                                } else {
                                    res.send({result: 'success'})
                                }
                            }
                        })
                    }
                }
            });
        }
    },

    onFormatAllDB: function () {
        var self = this;
        return function (req, res, next) {

            self.getSpeciesList(function (err, speciesList) {

                if (err) {
                    next(err);
                } else {
                    async.each(speciesList, function each(speciesName, done) {
                        self.database.findSpecies(speciesName, {
                            complete: function (err, speciesProps) {
                                if (err) {
                                    done(err)
                                } else {
                                    var dbFormatter = new DBFormatter(self.database, [new SpeciesDBImage(speciesName, [], speciesProps)]);
                                    dbFormatter.formatDB({
                                        species: speciesName,
                                        complete: function (err) {
                                            done(err);
                                        }
                                    })
                                }
                            }
                        });
                    }, function complete(err) {

                        if (err) {
                            next(err);
                        } else {
                            res.send({result: 'success'})
                        }
                    })
                }
            });
        }
    },

    onReset: function () {
        var self = this;
        return function (req, res, next) {

            self.getSpeciesList(function (err, speciesList) {
                if (err) {
                    next(err)
                } else {
                    async.each(speciesList, function each(species, onSpeciesDeleted) {

                        self.database.findAnimals({species: species}, {
                            isV1Format: false,
                            complete: function (err, pets) {
                                async.each(pets, function each(pet, onPetDeleted) {
                                    self.database.removeAnimal(pet.species, {
                                        petId: pet.petId
                                    }, {
                                        complete: function (err) {
                                            onPetDeleted(err);
                                        }
                                    })
                                }, function complete(err) {
                                    onSpeciesDeleted(err);
                                })

                            }
                        });
                    }, function complete(err) {
                        if (err) return next(err);
                        csvReader.parseSchema({
                            readPath: [
                                path.resolve(process.cwd(), 'tmp/CfO_Animal_Adoption_DB_Model - Cats.csv'),
                                path.resolve(process.cwd(), 'tmp/CfO_Animal_Adoption_DB_Model - Dogs.csv')
                            ],
                            cache: true,
                            done: onSchemaParsed
                        });
                    });
                }
            });


            function onSchemaParsed() {
                csvReader.parseModel({
                    readPath: [
                        path.resolve(process.cwd(), 'tmp/CfO_Animal_Adoption_DB_Model - Cats.csv'),
                        path.resolve(process.cwd(), 'tmp/CfO_Animal_Adoption_DB_Model - Dogs.csv')
                    ],
                    cache: true,
                    done: onModelsParsed
                });
            }

            function onModelsParsed(formattedSchema, options) {
                self.log('schema parsed');
                csvReader.parseOptions({
                    cache: true,
                    readPath: [
                        path.resolve(process.cwd(), 'tmp/CfO_Animal_Adoption_DB_Options - Small Animals.csv'),
                        path.resolve(process.cwd(), 'tmp/CfO_Animal_Adoption_DB_Options - Rabbits.csv'),
                        path.resolve(process.cwd(), 'tmp/CfO_Animal_Adoption_DB_Options - Reptiles.csv'),
                        path.resolve(process.cwd(), 'tmp/CfO_Animal_Adoption_DB_Options - Birds.csv'),
                        path.resolve(process.cwd(), 'tmp/CfO_Animal_Adoption_DB_Options - Dogs.csv'),
                        path.resolve(process.cwd(), 'tmp/CfO_Animal_Adoption_DB_Options - Cats.csv')
                    ],
                    done: onOptionsParsed
                })
            }

            function onOptionsParsed() {
                self.log('options parsed');
                csvReader.parseDataset({
                    cache: true,
                    done: onDatasetParsed
                });
            }

            function onDatasetParsed(petCollection, options) {
                self.log('dataset parsed');
                var numOfPets = petCollection.length;
                async.forEachOfSeries(petCollection,
                    function each(petData, petIndex, done) {
                        self.log('saving pet %j', petData);
                        self.database.saveAnimal(petData.species || 'dog',
                            petData,
                            {
                                debug: self._apiOptions.debugLevel,
                                complete: function (err) {
                                    if (err) {
                                        self.error(dump(err));
                                        done(err);
                                    } else if (petIndex < numOfPets) {
                                        self.log('Saved pet %s/%s', petIndex + 1, numOfPets);
                                        done();
                                    } else {
                                        done();
                                    }
                                }
                            });
                        // done();
                    },
                    function done(err) {
                        if (err) {
                            next(err);
                        } else {
                            self.onFormatAllDB(req, res, next);
                        }
                    }
                );
            }
        }
    }

}, Debuggable.prototype);

module.exports = APIController;
