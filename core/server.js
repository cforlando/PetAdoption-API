var fs = require('fs'),
    path = require('path'),
    util = require('util'),

    _ = require('lodash'),
    logger = require('morgan'),
    bodyParser = require('body-parser'),
    express = require('express'),
    cookieParser = require('cookie-parser'),
    
    server = express(),
    ipAddress = (process.env.OPENSHIFT_NODEJS_IP) ? process.env.OPENSHIFT_NODEJS_IP : null,
    portNumber = normalizePort(process.env.OPENSHIFT_NODEJS_PORT || process.env.PORT || '8080');

server.set('port', portNumber);

// view engine setup
server.set('views', path.join(__dirname, 'views'));
server.set('view engine', 'jade');


server.use(logger('dev'));
server.use(bodyParser.json());
server.use(bodyParser.urlencoded({ extended: false }));
server.use(cookieParser());
server.use(require('stylus').middleware(path.join(process.cwd(), 'public')));
server.use(express.static(path.join(process.cwd(), 'public')));

server.use('/', require('./routes/index'));
server.use('/api/v1/', require('./routes/api'));
server.use('/api/v2/', require('./routes/api'));


// express error handlers
server.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: (server.get('env') === 'development') ? err : {}
    });
});

//CORS access
server.use(function (err, req, res, next) {
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header("Access-Control-Allow-Origin", "*");
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

console.log('server listening for requests on port: %d', portNumber);
server.listen(portNumber, ipAddress);
module.exports = server;
