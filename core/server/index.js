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
    ServerUtils = require('./utils'),

    assetsRedirect = require('./middleware/assests-redirect'),
    flags = require('./middleware/flags'),
    headers = require('./middleware/headers'),
    pagination = require('./middleware/pagination'),
    dataFormatter = require('./middleware/data-formatter'),
    localImageHandler = require('./middleware/local-image-handler');

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
            publicDir: path.join(process.cwd(), 'public/')
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
        secret: config.server_session_secret,
        saveUninitialized: true,
        resave: true
    }));

    // redirect images to s3 resource
    server.use('/images', assetsRedirect());

    server.use(Express.static(_options.publicDir));


    server.use(flags());
    server.use(headers());

    server.use('/', router.view);
    server.use('/api/v1/', router.api);
    server.use('/api/v2/', router.api);

    // paginate data
    server.use(pagination());

    // format and send data
    server.use(dataFormatter());

    // send placeholder 404 images
    // server.use(localImageHandler());

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
