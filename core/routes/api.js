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
    dump = require('../../lib/dump'),

    router = Express(),
    database = MongoDB, //  can use MongoDB || Couchbase
    _options = {
        pageSize: 10,
        simplifiedFormat: false
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

// set simplifiedFormat flag
router.use(function (req, res, next) {
    if (/v2$/.test(req.baseUrl) && /^\/(list|query)/.test(req.path)) {
        _options.simplifiedFormat = true;
    }
    next();
});

//set CORS access
router.use(function (err, req, res, next) {
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header("Access-Control-Allow-Origin", "*");
});

function onListRequest(req, response, next) {
    var queryData = {
        species: req.params['species'],
        ignoreCaseFor: ['species']
    };

    database.findAnimals(queryData, {
        debug: config.isDevelopment,
        complete: function (err, animals) {
            if (err) {
                response.locals.data = err;
            } else if (_.isArray(animals)) {
                response.locals.data = animals;
            } else {
                response.locals.data = [];
            }
            next();
        }
    });
}

function onQueryRequest(req, response, next) {
    var queryData = req.body;

    database.findAnimals(queryData, {
        debug: config.isDevelopment,
        complete: function (err, animals) {
            //console.log('getAnimal().mongoDB.findAnimal() - found animal:', animal);
            if (err) {
                response.locals.data = err;
            } else if (animals && animals.length > 0) {
                response.locals.data = animals;
            } else {
                response.locals.data = [];
            }
            next();
        }
    });

}

function onOptionsRequest(req, res) {
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
}

function onOptionRequest(req, res) {
    var species = req.params['species'],
        optionName = req.params['option'];

    fs.readFile(path.resolve(process.cwd(), 'core/data/options.json'),
        {encoding: 'utf8'},
        function (err, str) {
            if (err) {
                res.send(err);
            } else {
                var options = JSON.parse(str);
                res.locals.data = options[species][optionName];
            }
        });
}

function onSave(req, res, next) {

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
}

function onModelRequest(req, res) {
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
}

function onSchemaRequest(req, res) {
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
}

function onResetRequest(req, res, next) {
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
}

router.get('/options/:species', onOptionsRequest);
router.get('/options/:species/:option', onOptionRequest);
router.get('/options/:species/:option/:pageNumber', onOptionRequest);
router.get('/model/:species', onModelRequest);
router.get('/schema/:species', onSchemaRequest);
router.get('/list/:species/', onListRequest);
router.get('/list/:species/:pageNumber', onListRequest);
router.post('/save', onSave);
router.post('/query', onQueryRequest);
router.post('/query/:pageNumber', onQueryRequest);

router.get('/reset', onResetRequest);

// paginate data
router.use(function (request, response, next) {
    var pageNum = (function () {
            var parsedPageNum = parseInt(request.params['pageNumber'] || 1) - 1; // page numbers start at 1
            if (parsedPageNum < 0) return 0;
            return parsedPageNum;
        })(),
        _pageSize = (request.query.pageSize || _options.pageSize),
        _startIndex = pageNum * _pageSize;

    if (_.isArray(response.locals.data) && _.isFinite(pageNum) && response.locals.data.length > _pageSize) {
        response.locals.data = response.locals.data.slice(_startIndex, _startIndex + _pageSize);
    }
    next();
});

// format and send data
router.use(function (request, response, next) {

    function simplifyResult(data) {


        return data.map(function(animalProps, index) {
            var _animalProps = {};
            _.forEach(animalProps, function(propData, propName){
                _animalProps[propName] = propData.val;
            });
            return _animalProps;
        });
    }

    if (_options.simplifiedFormat) {
        response.send(simplifyResult(response.locals.data));
    } else {
        response.send(response.locals.data);
    }
});

module.exports = router;