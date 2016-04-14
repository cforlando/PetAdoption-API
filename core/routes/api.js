var fs = require('fs'),
    path = require('path'),
    util = require('util'),

    _ = require('lodash'),
    logger = require('morgan'),
    async = require('async'),
    bodyParser = require('body-parser'),
    Express = require('express'),

    MongoDB = require('../mongodb'),
    csvReader = require('../csv-parser'),
    config = require('../config'),

    router = Express(),
    database = MongoDB, //  can use MongoDB || Couchbase
    _options = {
        pageSize: 10
    };

router.use(logger('dev'));
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({extended: false}));

// express error handlers
router.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: (router.get('env') === 'development') ? err : {}
    });
});

//CORS access
router.use(function (err, req, res, next) {
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header("Access-Control-Allow-Origin", "*");
});

router.get('/options/:species', function (req, res) {
    var species = req.params['species'];

    fs.readFile(path.resolve(process.cwd(), 'core/data/options.json'),
        {encoding: 'utf8'},
        function (err, str) {
            if (err) {
                res.send(err);
            } else {
                var options = JSON.parse(str);
                res.send(JSON.stringify(options[species]));
            }
        });
});

router.get('/options/:species/:option', function (req, res) {
    var species = req.params['species'],
        optionName = req.params['option'];


    fs.readFile(path.resolve(process.cwd(), 'core/data/options.json'),
        {encoding: 'utf8'},
        function (err, str) {
            if (err) {
                res.send(err);
            } else {
                var options = JSON.parse(str);

                res.send(JSON.stringify(options[species][optionName]));
            }
        });
});

router.get('/options/:species/:option/:paged', function (req, res) {
    var species = req.params['species'],
        optionName = req.params['option'],
        pageNum = (function () {
            var parsedPageNum = parseInt(req.params['paged']) - 1; // page numbers start at 1
            if (parsedPageNum < 0) return 0;
            return parsedPageNum;
        })(),
        _pageSize = (req.query.pageSize || _options.pageSize),
        _startIndex = pageNum * _pageSize;

    fs.readFile(path.resolve(process.cwd(), 'core/data/options.json'),
        {encoding: 'utf8'},
        function (err, str) {
            if (err) {
                res.send(err);
            } else {
                var options = JSON.parse(str),
                    option = options[species][optionName];
                if (_.isFinite(pageNum) && option.length > _pageSize) {
                    res.send(option.slice(_startIndex, _startIndex + _pageSize));
                } else {
                    res.send(option);
                }
            }
        });
});


router.post('/save', function (req, res, next) {

    database.saveAnimal(req.body, {
        debug: config.isDevelopment,
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
});

router.get('/model/:species', function (req, res) {
    var species = req.params['species'];

    fs.readFile(path.resolve(process.cwd(), 'core/data/models.json'),
        {encoding: 'utf8'},
        function (err, str) {
            if (err) {
                res.send(err);
            } else {
                var models = JSON.parse(str);

                res.send(JSON.stringify(models[species]));
            }
        });
});

router.get('/schema/:species', function (req, res) {
    var species = req.params['species'];

    fs.readFile(path.resolve(process.cwd(), 'core/data/schema.json'),
        {encoding: 'utf8'},
        function (err, str) {
            if (err) {
                res.send(err);
            } else {
                var schemas = JSON.parse(str);

                res.send(JSON.stringify(schemas[species]));
            }
        });
});

router.get('/list/:species', function (req, response) {
    var queryData = {
            species: req.params['species']
        },
        pageNum = (function () {
            var parsedPageNum = parseInt(req.params['paged'] || 1) - 1; // page numbers start at 1
            if (parsedPageNum < 0) return 0;
            return parsedPageNum;
        })(),
        _pageSize = (req.query.pageSize || _options.pageSize),
        _startIndex = pageNum * _pageSize;

    database.findAnimals(queryData, {
        complete: function (err, animals) {
            if (err) {
                response.send(err)
            } else if (_.isArray(animals)) {
                response.send(animals);
            } else {
                response.send([])
            }
        }
    });
});

router.post('/query', function (req, response) {
    var queryData = req.body;

    database.findAnimals(queryData, {
        debug: config.isDevelopment,
        complete: function (err, animals) {
            //console.log('getAnimal().mongoDB.findAnimal() - found animal:', animal);
            if (err) {
                response.send(err)
            } else if (animals && animals.length > 0) {
                response.send(animals);
            } else {
                //console.log('getAnimal().mongoDB.findAnimal() - failed to find animal. Will save as new animal');
                response.send([]);
            }
        }
    });

});

router.post('/query/:paged', function (req, response) {
    var queryData = req.body,
        pageNum = (function () {
            var parsedPageNum = parseInt(req.params['paged']) - 1; // page numbers start at 1
            if (parsedPageNum < 0) return 0;
            return parsedPageNum;
        })(),
        _pageSize = (req.query.pageSize || _options.pageSize),
        _startIndex = pageNum * _pageSize;

    database.findAnimals(queryData, {
        debug: config.isDevelopment,
        complete: function (err, animals) {
            //console.log('getAnimal().mongoDB.findAnimal() - found animal:', animal);
            if (err) {
                response.send(err)
            } else if (animals && animals.length > 0) {

                if (_.isFinite(pageNum) && animals.length > _pageSize) {
                    response.send(animals.slice(_startIndex, _startIndex + _pageSize));
                } else {
                    response.send(animals);
                }
            } else {
                //console.log('getAnimal().mongoDB.findAnimal() - failed to find animal. Will save as new animal');
                response.send([]);
            }
        }
    });

});

router.get('/reset', function (req, res, next) {
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
                MongoDB.saveAnimal(petData, {
                    debug: config.isDevelopment,
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
                })
            },
            function done(err) {
                res.send(err || {result: 'success'});
            }
        );
    }
});

module.exports = router;