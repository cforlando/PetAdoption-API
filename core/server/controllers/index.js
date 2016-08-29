function ServerHandler() {
    var fs = require('fs'),
        path = require('path'),
        util = require('util'),

        config = require('../../config'),
        _ = require('lodash'),
        async = require('async'),
        multer = require('multer'),

        serverUtils = require('../utils'),
        database = require('../../database'),
        csvReader = require('../../csv-parser'),
        dump = require('../../../lib/dump'),

        self = this,
        cachedSpeciesList = (function () {
            try {
                var modelsDataStr = fs.readFileSync(path.resolve(process.cwd(), 'data/models.json')),
                    modelsData = JSON.parse(modelsDataStr);
                return Object.keys(modelsData);
            } catch (err) {
                console.warn(err);
            }
            return ['cat', 'dog'];
        })(),
        _options = {
            pageSize: 10,
            paths: {
                root: path.resolve(process.cwd(), 'public/'),
                images: '/images/pet/'
            }
        },
        storage = multer.diskStorage({
            destination: function (req, file, cb) {
                cb(null, path.join(_options.paths.root, _options.paths.images, (req.params.species + '/')))
            },
            filename: function (req, file, cb) {
                console.log('new file: %s', dump(file));
                cb(null, file.originalname)
            }
        }),
        upload = multer({storage: storage});

    this.authenticator = require('./auth');

    this.upload = upload;

    this.onSpeciesListRequest = function (req, res, next) {
        fs.readFile(path.resolve(process.cwd(), 'data/models.json'),
            {encoding: 'utf8'},
            function (err, str) {
                if (err) {
                    next(err);
                } else {
                    var models = JSON.parse(str);
                    res.send(Object.keys(models));
                }
            });
    };

    this.onListRequest = function (req, res, next) {

        res.locals.pageNumber = req.params['pageNumber'];

        database.findAnimals({species: req.params.species},
            {
                debug: config.debugLevel,
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
    };

    this.onListAllRequest = function (req, res, next) {
        var responseData = [];
        res.locals.pageNumber = req.params['pageNumber'];

        async.each(cachedSpeciesList, function each(species, done) {
            database.findAnimals({species: species}, {
                debug: config.debugLevel,
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
    };

    this.onQueryRequest = function (req, res, next) {
        var queryData = req.body;
        res.locals.pageNumber = req.params['pageNumber'];

        database.findAnimals(queryData, {
            debug: config.debugLevel,
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

    };

    this.onOptionsRequest = function (req, res, next) {
        var species = req.params['species'];

        fs.readFile(path.resolve(process.cwd(), 'data/options.json'),
            {encoding: 'utf8'},
            function (err, str) {
                if (err) {
                    next(err);
                } else {
                    var options = JSON.parse(str);
                    if (options[species]) {
                        res.locals.simplifiedFormat = false;
                        res.locals.data = options[species];
                        next();
                    } else {
                        next(new Error("Options for requested species does not exist."));
                    }
                }
            });
    };

    this.onSingleOptionRequest = function (req, res, next) {
        var species = req.params['species'],
            optionName = req.params['option'];


        fs.readFile(path.resolve(process.cwd(), 'data/options.json'),
            {encoding: 'utf8'},
            function (err, str) {
                if (err) {
                    next(err);
                } else {
                    var options = JSON.parse(str);
                    if (options[species]) {
                        res.locals.simplifiedFormat = false;
                        res.locals.data = options[species][optionName];
                        next();
                    } else {
                        next(new Error("Option for requested species does not exist."));
                    }
                }
            });
    };

    this.onModelRequest = function (req, res, next) {

        database.findModel(req.params.species, {
            debug: config.debugLevel,
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
    };

    this.onSchemaRequest = function (req, res, next) {
        var species = req.params.species;

        fs.readFile(path.resolve(process.cwd(), 'data/schema.json'),
            {encoding: 'utf8'},
            function (err, str) {
                if (err) {
                    next(err);
                } else {
                    var schemas = JSON.parse(str);
                    if (schemas[species]) {
                        res.locals.simplifiedFormat = false;
                        res.locals.data = schemas[species];
                    } else {
                        next(new Error("Schema for requested species does not exist."));
                    }
                }
            });
    };

    this.onDeleteRequest = function (req, res, next) {

        database.removeAnimal(
            req.params.species,
            req.body, {
                debug: config.debugLevel,
                complete: function (err, result) {
                    if (err) {
                        next(err);
                    } else {
                        res.json(result)
                    }
                }
            })
    };

    this.onJSONSave = function (req, res, next) {

        database.saveAnimal(
            req.params.species,
            req.body, {
                debug: config.debugLevel,
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
    };

    this.onMediaSave = function (req, res, next) {
        var props = req.body,
            imagesValue = props.images || '';

        props.images = imagesValue.split(',');

        _.forEach(req.files, function (fileMeta, index) {
            props.images.push(path.join(config.domain, _options.paths.images, (req.params.species + '/'), fileMeta.filename));
        });

        props.images = _.filter(props.images, function (url) {
            // only truthy values
            return !!url;
        });
        database.saveAnimal(
            req.params.species,
            props, {
                debug: config.debugLevel,
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
    };

    this.onModelSave = function (req, res, next) {
        database.saveModel(
            req.params.species,
            req.body, {
                debug: config.debugLevel,
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

    };

    this.onLoginRequest = this.authenticator.onLoginRequest;

    this.onFormatDBRequestSpecies = function (req, res, next) {

        serverUtils.formatter.formatDB({
            species: req.params.species,
            complete: function (err) {
                if (err) {
                    next(err);
                } else {
                    res.send({result: 'success'})
                }
            }
        })
    };

    this.onFormatDBRequestAll = function (req, res, next) {

        async.each(cachedSpeciesList, function each(species, done) {
            serverUtils.formatter.formatDB({
                species: species,
                complete: function (err) {
                    done(err);
                }
            })
        }, function complete(err) {

            if (err) {
                next(err);
            } else {
                res.send({result: 'success'})
            }
        })
    };

    this.onResetRequest = function (req, res, next) {

        async.each(cachedSpeciesList, function each(species, onSpeciesDeleted) {

            database.findAnimals({species: species}, {
                complete: function (err, pets) {
                    async.each(pets, function each(pet, onPetDeleted) {
                        database.removeAnimal(pet.species.val, {
                            petId: pet.petId.val
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
            console.log('schema parsed');
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
            console.log('options parsed');
            csvReader.parseDataset({
                cache: true,
                done: onDatasetParsed
            });
        }

        function onDatasetParsed(petCollection, options) {
            console.log('dataset parsed');
            var numOfPets = petCollection.length;
            async.forEachOfSeries(petCollection,
                function each(petData, petIndex, done) {
                    console.log('saving pet %j', petData);
                    database.saveAnimal(petData.species || 'dog',
                        petData,
                        {
                            debug: config.debugLevel,
                            complete: function (err) {
                                if (err) {
                                    console.error(dump(err));
                                    done(err);
                                } else if (petIndex < numOfPets) {
                                    console.log('Saved pet %s/%s', petIndex + 1, numOfPets);
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
                        self.onFormatDBRequestAll(req, res, next);
                    }
                }
            );
        }
    };

}


module.exports = new ServerHandler();
