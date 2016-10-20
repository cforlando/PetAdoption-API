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
    session = require('express-session'),
    compression = require('compression'),

    Debuggable = require('../lib/debuggable'),
    Router = require('./router'),
    ServerUtils = require('./utils');

/**
 * @class Server
 * @param {MongoAPIDatabase} database
 * @param {Object} [options]
 * @param {DebugLevel} [options.debugLevel]
 * @returns {Express}
 * @constructor
 */
function Server(database, options) {
    var server = Express(),
        _options = _.defaults(options, {
            debugTag: 'Server: ',
            pageSize: 10,
            publicDir: path.join(process.cwd(), 'public/'),
            placeholderDir: path.join(process.cwd(), 'public/images/placeholders/'),
            defaultPlaceholderPath: path.join(process.cwd(), 'public/images/placeholders/default.png')
        }),
        router = new Router(database, options);

    this.setDebugTag(_options.debugTag);
    this.setDebugLevel(_options.debugLevel);
    this.log(Debuggable.LOW, 'Server()');

    // view engine setup
    server.set('views', path.resolve(__dirname, 'views'));
    server.set('view engine', 'pug');

    server.use(logger('dev'));
    server.use(cookieParser());
    server.use(bodyParser.json());
    server.use(bodyParser.urlencoded({extended: false}));
    server.use(compression());
    /*
     if (!config.isDevelopment) {
     app.set('trust proxy', 1); // trust first proxy
     sess.cookie.secure = true; // serve secure cookies
     }
     */
    server.set('trust proxy', 1); // trust first proxy
    server.use(session({
        secret: 'cfo-petadoption-api',
        saveUninitialized: true,
        resave: true
    }));

    server.use(Express.static(path.join(process.cwd(), 'public')));


    // set simplifiedFormat flag
    server.use(function (req, res, next) {
        res.locals.simplifiedFormat = /^\/api\/v2\/(list|query)/.test(req.path);
        next();
    });

    // set reduceOutput flag
    server.use(function (req, res, next) {
        switch (req.method) {
            case 'GET':
                res.locals.reducedOuput = (req.query.properties) ? ServerUtils.parseArrayStr(req.query.properties) : false;
                break;
            case 'POST':
                res.locals.reducedOuput = (_.isArray(req.body.properties)) ? req.body.properties : false;
                break;
            default:
                break;
        }
        next();
    });

    // Set default headers
    // server.use(function (req, res, next){
    //     res.header("Cache-Control", util.format("max-age=%s", (60 * 60))); // 60 seconds * 60 minutes
    //     next();
    // });

    //CORS access
    server.use(function (req, res, next) {
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        res.header("Access-Control-Allow-Origin", "*");
        next();
    });

    server.use('/', router.view);
    server.use('/api/v1/', router.api);
    server.use('/api/v2/', router.api);

    // paginate data
    server.use(function (request, response, next) {
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
    server.use(function (request, response, next) {
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
        } else {
            next()
        }
    });

    // send placeholder 404 images
    server.use(function (req, res, next) {
        if (/\.(jpg|png)$/i.test(req.path)) {
            fs.access(path.resolve(_options.publicDir, req.path), function (err) {
                if (err) {
                    // file not found
                    var placeholderImgPath = _options.defaultPlaceholderPath;
                    if(req.params.species){
                        placeholderImgPath = path.join(_options.placeholderDir, req.params.species + '.png');
                    } else if(req.path.match(/cat/)){
                        placeholderImgPath = path.join(_options.placeholderDir, 'cat.png');
                    } else if(req.path.match(/dog/)){
                        placeholderImgPath = path.join(_options.placeholderDir, 'dog.png');
                    }
                    fs.access(placeholderImgPath, function (err) {
                        if (err) {
                            // placeholder not found
                            res.sendFile(_options.defaultPlaceholderPath);
                        } else {
                            res.sendFile(placeholderImgPath);
                        }
                    })
                } else {
                    next();
                }
            });
        } else {
            next();
        }
    });

    // express error handlers
    server.use(function (err, req, res, next) {
        console.error('error: %s', ServerUtils.dump(err));
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: config.isDevelopment ? err : {},
            isDevelopment: config.isDevelopment
        });
    });

    return server;
}


Server.prototype = Debuggable.prototype;


module.exports = Server;
