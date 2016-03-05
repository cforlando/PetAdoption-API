var Express = require('express'),
    fs = require('fs'),
    path = require('path'),
    router = Express(),
    _ = require('lodash'),
    logger = require('morgan'),
    bodyParser = require('body-parser'),
    MongoDB = require('./mongodb/index'),
    portNumber = normalizePort(process.env.PORT || '5000');

router.use(logger('dev'));
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: false }));

// error handlers
router.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: (router.get('env') === 'development') ? err : {}
    });
});

//CORS access
router.use(function(err, req, res, next) {
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header("Access-Control-Allow-Origin" , "*");
});

router.post('/save', function(req, res){

    MongoDB.saveAnimal(req.body, {
        debug : true,
        complete : function(err, newAnimal){
            if(err){
                res.send(err)
            } else {
                res.send(newAnimal)
            }
        }
    })
});

router.get('/schema', function (req, res) {
    var type = req.params['filter'];

    fs.readFile(path.resolve('./', 'core/mongodb/schemas/animal.json'), 'utf8', function(err, str){
        if(err){
            res.send(err);
        } else{
            res.send(str);
        }
    });
});

router.get('/list/:species', function (req, response) {
    var queryData = {
            species : req.params['species']
        };

    MongoDB.findAnimals(queryData, {
        debug : true,
        complete : function(err, animals){
            console.log('mongoDB.findAnimal() - found animal:', animals);
            if(err){
                response.send(err)
            } else if(_.isArray(animals)) {
                response.send(animals);
            } else {
                console.log('mongoDB.findAnimal() - failed to find animal. Will save as new animal');
                MongoDB.saveAnimal(queryData, {
                    debug : true,
                    complete : function(err, newAnimal){
                        response.send(newAnimal);
                    }
                });

            }
        }
    });

});

router.post('/query/:species', function (req, response) {

    MongoDB.findAnimals(req.body, {
        debug : true,
        complete : function(err, animal){
            //console.log('getAnimal().mongoDB.findAnimal() - found animal:', animal);
            if(err){
                response.send(err)
            } else if(animal && animal['species']) {
                response.send(animal);
            } else {
                //console.log('getAnimal().mongoDB.findAnimal() - failed to find animal. Will save as new animal');
                MongoDB.saveAnimal(queryData, {
                    complete : function(err, newAnimal){
                        response.send(newAnimal);
                    }
                });

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
