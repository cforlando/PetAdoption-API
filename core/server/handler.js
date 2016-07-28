function ServerHandler() {
    var fs = require('fs'),
        path = require('path'),
        util = require('util'),

        config = require('../config'),
        _ = require('lodash'),
        async = require('async'),
        multer = require('multer'),

        database = require('../database'),
        csvReader = require('../csv-parser'),
        dump = require('../../lib/dump'),

        _options = {
            pageSize: 10,
            paths: {
                root: path.resolve(process.cwd(), 'public/'),
                images: '/images/pet/'
            }
        };

    this.onListRequest = function (req, res, next) {
        var queryData = {
            species: req.params['species'],
            ignoreCaseFor: ['species']
        };
        res.locals.pageNumber = req.params['pageNumber'];

        database.findAnimals(queryData, {
            debug: config.debugLevel,
            complete: function (err, animals) {
                if (err) {
                    res.locals.data = err;
                } else if (_.isArray(animals)) {
                    res.locals.data = animals;
                } else {
                    res.locals.data = [];
                }
                next();
            }
        });
    };

    this.onQueryRequest = function (req, res, next) {
        var queryData = req.body;
        res.locals.pageNumber = req.params['pageNumber'];

        database.findAnimals(queryData, {
            debug: config.debugLevel,
            complete: function (err, animals) {
                //console.log('getAnimal().mongoDB.findAnimal() - found animal:', animal);
                if (err) {
                    res.locals.data = err;
                } else if (animals && animals.length > 0) {
                    res.locals.data = animals;
                } else {
                    res.locals.data = [];
                }
                next();
            }
        });

    };

    this.onOptionsRequest = function (req, res) {
        var species = req.params['species'];

        fs.readFile(path.resolve(process.cwd(), 'data/options.json'),
            {encoding: 'utf8'},
            function (err, str) {
                if (err) {
                    res.send(err);
                } else {
                    var options = JSON.parse(str);
                    res.send(JSON.stringify(options[species]));
                }
            });
    };

    this.onOptionRequest = function (req, res) {
        var species = req.params['species'],
            optionName = req.params['option'];
        res.locals.pageNumber = req.params['pageNumber'];

        fs.readFile(path.resolve(process.cwd(), 'data/options.json'),
            {encoding: 'utf8'},
            function (err, str) {
                if (err) {
                    res.send(err);
                } else {
                    var options = JSON.parse(str);
                    res.locals.data = options[species][optionName];
                }
            });
    };

    this.onSaveJSON = function (req, res, next) {

        database.saveAnimal(req.body, {
            debug: config.debugLevel,
            complete: function (err, newAnimal) {
                if (err) {
                    res.send({result: err})
                } else {
                    res.send({
                        result: 'success',
                        data: newAnimal
                    })
                }
            }
        });
    };

    this.onSaveMedia = function (req, res, next) {
        console.log('onSaveMedia: %s-\n%s', dump(req.files), dump(req.body));
        var _body = req.body;
        _body.images = _body.images.split(',');
        _.forEach(req.files, function (fileMeta, index) {
            _body.images.push(path.join(_options.paths.images, fileMeta.filename));
        });
        database.saveAnimal(_body, {
            debug: config.debugLevel,
            complete: function (err, newAnimal) {
                if (err) {
                    res.send({result: err})
                } else {
                    res.send({
                        result: 'success',
                        data: newAnimal
                    })
                }
            }
        });
    };

    this.onSaveModel = function (req, res, next) {

        database.saveModel(req.body, {
            debug: config.debugLevel,
            complete: function (err, newAnimal) {
                if (err) {
                    res.send({result: err})
                } else {
                    res.send({
                        result: 'success',
                        data: newAnimal
                    })
                }
            }
        });

    };

    this.onModelRequest = function (req, res) {
        var species = req.params['species'];

        database.findModel({
            species: {
                defaultVal: species
            }
        }, {
            debug: config.debugLevel,
            complete: function (err, animalModel) {
                res.send(err || animalModel);
            }
        })
    };

    this.onSchemaRequest = function (req, res) {
        var species = req.params['species'];

        fs.readFile(path.resolve(process.cwd(), 'data/schema.json'),
            {encoding: 'utf8'},
            function (err, str) {
                if (err) {
                    res.send(err);
                } else {
                    var schemas = JSON.parse(str);

                    res.send(JSON.stringify(schemas[species]));
                }
            });
    };

    this.onDeleteRequest = function (req, res, next) {
        database.removeAnimal(req.body, {
            debug: config.debugLevel,
            complete: function (result) {
                console.log('database.removeAnimal() - results: %j', arguments);
                res.send(result)
            }
        })
    };

    this.onResetRequest = function (req, res, next) {
        console.log('/reset');

        csvReader.parseSchema({
            readPath: [
                path.resolve(process.cwd(), 'tmp/CfO_Animal_Adoption_DB_Model - Cats.csv'),
                path.resolve(process.cwd(), 'tmp/CfO_Animal_Adoption_DB_Model - Dogs.csv')
            ],
            cache: true,
            done: onSchemaParsed
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
                    database.saveAnimal(petData, {
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
                    res.send(err || {result: 'success'});
                }
            );
        }
    };
    
    
    this.onFormatDBRequest = function(req, res, next){
        require('./utils').formatter.formatDB({
            complete : function(err){
                res.send({result: err || 'success'})
            }
        })
    };

}


module.exports = new ServerHandler();
