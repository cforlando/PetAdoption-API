var fs = require('fs'),
    path = require('path'),
    util = require('util'),

    _ = require('lodash'),
    async = require('async'),
    bodyParser = require('body-parser'),
    Express = require('express'),
    multer = require('multer'),

    MongoDB = require('../mongodb'),
    csvReader = require('../csv-parser'),
    config = require('../config'),
    dump = require('../../lib/dump'),

    router = Express(),
    database = MongoDB, //  can use MongoDB || Couchbase
    _options = {
        pageSize: 10,
        paths: {
            root: path.resolve(process.cwd(), 'public/'),
            images: '/images/pet/'
        }
    },
    storage = multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, path.join(_options.paths.root, _options.paths.images))
        },
        filename: function (req, file, cb) {
            console.log('new file: %s', dump(file));
            cb(null, file.originalname)
        }
    }),
    upload = multer({storage: storage});

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
    res.locals.simplifiedFormat = (/v2$/.test(req.baseUrl) && /^\/(list|query)/.test(req.path));
    next();
});

//set CORS access
router.use(function (err, req, res, next) {
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header("Access-Control-Allow-Origin", "*");
});

function onListRequest(req, res, next) {
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
}

function onQueryRequest(req, res, next) {
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
    res.locals.pageNumber = req.params['pageNumber'];

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

function onSaveJSON(req, res, next) {

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
}

function onSaveMedia(req, res, next) {
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
}

function onSaveModel(req, res, next) {

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


}

function onModelRequest(req, res) {
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

function onDeleteRequest(req, res, next) {
    database.removeAnimal(req.body, {
        debug: config.debugLevel,
        complete: function (result) {
            console.log('database.removeAnimal() - results: %j', arguments);
            res.send(result)
        }
    })
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
                console.log('saving pet %j', petData);
                MongoDB.saveAnimal(petData, {
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
}

router.get('/options/:species/', onOptionsRequest);
router.get('/options/:species/:option', onOptionRequest);
router.get('/options/:species/:option/:pageNumber/', onOptionRequest);
router.get('/model/:species/', onModelRequest);
router.get('/schema/:species/', onSchemaRequest);
router.get('/list/:species/', onListRequest);
router.get('/list/:species/:pageNumber/', onListRequest);
router.post('/save/json', onSaveJSON);
router.post('/save', upload.array('uploads'), onSaveMedia);
router.post('/save/model', onSaveModel);
router.post('/query/:pageNumber', onQueryRequest);
router.post('/query', onQueryRequest);
router.post('/remove', onDeleteRequest);

router.get('/reset', onResetRequest);

// paginate data
router.use(function (request, response, next) {
    var pageNum = (function () {
            var parsedPageNum = (parseInt(response.locals.pageNumber) || 1) - 1; // page numbers start at 1
            if (parsedPageNum < 0) return 0;
            return parsedPageNum;
        })(),
        _pageSize = parseInt(request.query['pageSize'] || request.body['pageSize'] || _options.pageSize),
        _startIndex = pageNum * _pageSize;

    if (_.isFinite(parseInt(response.locals.pageNumber)) && _.isArray(response.locals.data) && response.locals.data.length > _pageSize) {
        response.locals.data = response.locals.data.slice(_startIndex, _startIndex + _pageSize);
    }
    next();
});

// format and send data
router.use(function (request, response, next) {

    function simplifyResult(data) {


        return data.map(function (animalProps, index) {
            var _animalProps = {};
            _.forEach(animalProps, function (propData, propName) {
                _animalProps[propName] = propData.val;
            });
            return _animalProps;
        });
    }

    if (response.locals.simplifiedFormat) {
        response.send(simplifyResult(response.locals.data));
    } else {
        response.send(response.locals.data);
    }
});

module.exports = router;
