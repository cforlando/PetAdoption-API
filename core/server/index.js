var fs = require('fs');
var path = require('path');
var util = require('util');

var logger = require('morgan');
var bodyParser = require('body-parser');
var Express = require('express');
var cookieParser = require('cookie-parser');
var config = require('../config');
var _ = require('lodash');
var async = require('async');
var compression = require('compression');
var log = require('debug')('pet-api:server');

var ServerRouter = require('./router');

var assetsRedirect = require('./middleware/assests-redirect');
var flags = require('./middleware/flags');
var headers = require('./middleware/headers');
var pagination = require('./middleware/pagination');
var dataFormatter = require('./middleware/data-formatter');
var localImageHandler = require('./middleware/local-image-handler');

/**
 * @class Server
 * @param {MongoAPIDatabase} database
 * @param {Object} [options]
 * @returns {Express}
 * @constructor
 */
function Server(database, options) {
    var server = Express();
    var opts = _.defaults(options, {
        publicDir: path.join(process.cwd(), 'public/')
    });
    var router = new ServerRouter(database, options);

    log('initializing');

    // view engine setup
    server.set('views', path.resolve(__dirname, 'views'));
    server.set('view engine', 'pug');

    server.use(logger(process.env.LOG || 'dev'));
    server.use(cookieParser());
    server.use(bodyParser.json());
    server.use(bodyParser.urlencoded({extended: true}));
    server.use(compression());

    server.set('trust proxy', 1); // trust first proxy hop

    // redirect images to s3 resource
    server.use('/images', assetsRedirect());

    server.use(Express.static(opts.publicDir));


    server.use(flags());
    server.use(headers());

    server.use('/', router.view);
    server.use('/api/v1/', router.api);
    server.use('/api/v2/', router.api);

    // paginate data
    server.use(pagination());

    // format and send data
    server.use(dataFormatter());

    /**
     * send placeholder 404 images
     * only works if serving images locally
     */
    // server.use(localImageHandler());

    // express error handlers
    server.use(function (err, req, res, next) {
        console.error('core.server error:', err);
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: config.DEVELOPMENT_ENV ? err : {},
            isDevelopment: config.DEVELOPMENT_ENV
        });
    });

    log('server initialized');

    return server;
}


module.exports = Server;
