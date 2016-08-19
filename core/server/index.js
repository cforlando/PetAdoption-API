var fs = require('fs'),
    path = require('path'),
    util = require('util'),

    logger = require('morgan'),
    bodyParser = require('body-parser'),
    Express = require('express'),
    cookieParser = require('cookie-parser'),
    config = require('../config'),
    _ = require('lodash'),
    async = require('async'),
    passport = require('passport'),
    BasicStrategy = require('passport-http').BasicStrategy,

    serverUtils = require('./utils'),

    server = {
        app: Express()
    },
    _options = {
        pageSize: 10,
        publicDir: path.resolve(process.cwd(), 'public/'),
        placeholderCatImg: path.resolve(process.cwd(), 'public/images/pet/cat/placeholder.png'),
        placeholderDogImg: path.resolve(process.cwd(), 'public/images/pet/dog/placeholder.png'),
        placeholderImg: path.resolve(process.cwd(), 'public/images/placeholder.jpg')
    };


// view engine setup
server.app.set('views', path.resolve(__dirname, 'views'));
server.app.set('view engine', 'pug');

server.app.use(logger('dev'));
server.app.use(bodyParser.json());
server.app.use(bodyParser.urlencoded({extended: false}));
server.app.use(cookieParser());

server.app.use(Express.static(path.join(process.cwd(), 'public')));


// set simplifiedFormat flag
server.app.use(function (req, res, next) {
    res.locals.simplifiedFormat = /^\/api\/v2\/(list|query)/.test(req.path);
    next();
});

// set reduceOutput flag
server.app.use(function (req, res, next) {
    switch (req.method){
        case 'GET':
            res.locals.reducedOuput = (req.query.properties) ? serverUtils.parseArrayStr(req.query.properties) : false;
            break;
        case 'POST':
            res.locals.reducedOuput = (_.isArray(req.body.properties)) ? req.body.properties : false;
            break;
        default:
            break;
    }
    next();
});

passport.use(new BasicStrategy(function (username, password, done) {
        var credentials = {
            username: username,
            password: password
        };
        console.log('credentials: %s', serverUtils.dump(credentials));
        if (username && password) {
            return done(null, credentials);
        } else {
            return done(null, false);
        }

    }
));

passport.serializeUser(function(user, done) {
    done(null, user);
});

passport.deserializeUser(function(user, done) {
    done(null, user);
});

server.app.use(passport.initialize());

//CORS access
server.app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header("Access-Control-Allow-Origin", "*");
    next();
});


server.app.use('/', require('./routes/index'));
server.app.use('/api/v1/', require('./routes/api'));
server.app.use('/api/v2/', require('./routes/api'));

// paginate data
server.app.use(function (request, response, next) {
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
server.app.use(function (request, response, next) {
    function formatResult(data) {

        return data.map(function (animalProps, index) {
            var _animalProps = {};
            _.forEach(animalProps, function (propData, propName) {
                if (response.locals.reducedOuput && response.locals.reducedOuput.indexOf(propName) < 0) return;
                _animalProps[propName] = (response.locals.simplifiedFormat) ? propData.val : propData;
            });
            return _animalProps;
        });
    }

    if (response.locals.data) {
        if (response.locals.simplifiedFormat || response.locals.reducedOuput) {
            response.json(formatResult(response.locals.data));
        } else {
            response.json(response.locals.data);
        }
    }else {
        next()
    }
});

// send placeholder 404 images
server.app.use(function (req, res, next) {
    if (/.(jpg|png)$/i.test(req.path)) {
        fs.access(path.resolve(_options.publicDir, req.path), function (err) {
            if (err) {
                if (req.path.match(/dog/i)){
                    res.sendFile(_options.placeholderDogImg);
                } else if(req.path.match(/cat/i)){
                    res.sendFile(_options.placeholderCatImg);
                } else {
                    res.sendFile(_options.placeholderImg);
                }
            } else {
                next();
            }
        });
    } else {
        next();
    }
});

// express error handlers
server.app.use(function (err, req, res, next) {
    console.log('error: %s', serverUtils.dump(err));
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: config.isDevelopment ? err : {},
        isDevelopment : config.isDevelopment
    });
});


module.exports = server;
