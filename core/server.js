var Express = require('express'),
    fs = require('fs'),
    path = require('path'),
    util = require('util'),
    router = Express(),
    _ = require('lodash'),
    logger = require('morgan'),
    bodyParser = require('body-parser'),
    MongoDB = require('./mongodb/index'),
    portNumber = normalizePort(process.env.PORT || '5000'),
    _options = {
        pageSize: 10
    };

router.use(logger('dev'));
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({extended: false}));

// error handlers
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

    fs.readFile(path.resolve('./', util.format('core/mongodb/cache/options.%s.json', species)), 'utf8', function (err, str) {
        if (err) {
            res.send(err);
        } else {
            res.send(str);
        }
    });
});

router.get('/options/:species/:option', function (req, res) {
    var species = req.params['species'],
        optionName = req.params['option'];

    fs.readFile(path.resolve('./', util.format('core/mongodb/cache/options.%s.json', species)), 'utf8', function (err, str) {
        if (err) {
            res.send(err);
        } else {
            var optionsData = JSON.parse(str),
                option = optionsData[optionName];

            res.send(option);
        }
    });
});

router.get('/options/:species/:option/:paged', function (req, res) {
    var species = req.params['species'],
        optionName = req.params['option'],
        pageNum = (function(){
            var parsedPageNum = parseInt(req.params['paged']) - 1; // page numbers start at 1
            if(parsedPageNum < 0) return 0;
            return parsedPageNum;
        })(),
        _pageSize = (req.query.pageSize || _options.pageSize),
        _startIndex = pageNum * _pageSize;

    fs.readFile(path.resolve('./', util.format('core/mongodb/cache/options.%s.json', species)), 'utf8', function (err, str) {
        if (err) {
            res.send(err);
        } else {
            var optionsData = JSON.parse(str),
                option = optionsData[optionName];
            if (_.isFinite(pageNum) && option.length > _pageSize) {
                res.send(option.slice(_startIndex, _startIndex + _pageSize));
            } else {
                res.send(option);
            }
        }
    });
});

router.post('/save', function (req, res) {

    MongoDB.saveAnimal(req.body, {
        debug: true,
        complete: function (err, newAnimal) {
            if (err) {
                res.send(err)
            } else {
                res.send(newAnimal)
            }
        }
    })
});

router.get('/schema', function (req, res) {
    var type = req.params['filter'];

    fs.readFile(path.resolve('./', 'core/mongodb/schemas/animal.json'), 'utf8', function (err, str) {
        if (err) {
            res.send(err);
        } else {
            res.send(str);
        }
    });
});

router.get('/list/:species', function (req, response) {
    var queryData = {
        species: req.params['species']
    };

    MongoDB.findAnimals(queryData, {
        debug: true,
        complete: function (err, animals) {
            console.log('mongoDB.findAnimal() - found animal:', animals);
            if (err) {
                response.send(err)
            } else if (_.isArray(animals)) {
                response.send(animals);
            } else {
                console.log('mongoDB.findAnimal() - failed to find animal. Will save as new animal');
                MongoDB.saveAnimal(queryData, {
                    debug: true,
                    complete: function (err, newAnimal) {
                        response.send(newAnimal);
                    }
                });

            }
        }
    });

});

router.post('/query/:species', function (req, response) {
    var queryData = req.body;
    MongoDB.findAnimals(queryData, {
        debug: true,
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

function normalizePort(val) {
    var port = parseInt(val, 10);

    if (isNaN(port)) {
        // named pipe
        return val;
    }

    if (port >= 0) {
        // port number
        return port;
    }

    return false;
}

console.log('server listening for requests on %d', portNumber);
router.listen(portNumber);
module.exports = router;
