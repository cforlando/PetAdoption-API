var http = require('http');
var https = require('https');
var path = require('path');
var fs = require('fs');

var config = require('./core/config');
var Server = require('./core/server');
var Database = require('./core/mongodb');
var serverUtils = require('./core/server/utils');

var database = new Database();
var server = new Server(database);

var ipAddress = process.env.OPENSHIFT_NODEJS_IP || null;
var httpPortNumber = serverUtils.normalizePort(config.PORT);
var httpsPortNumber = serverUtils.normalizePort(config.HTTPS_PORT);
var privateKey = (function () {
    try {
        return fs.readFileSync(path.resolve(__dirname, 'ssl/server.key'), 'utf8');
    } catch (err) {
        return false;
    }
})();
var certificate = (function () {
    try {
        return fs.readFileSync(path.resolve(__dirname, 'ssl/server.crt'), 'utf8');
    } catch (err) {
        return false
    }
})();
var httpServer = http.createServer(server);
var httpsServer = https.createServer({key: privateKey, cert: certificate}, server);


process.on('unhandledRejection', function (err) {
    console.error(err);
});

module.exports = {
    startHTTP: function () {
        httpServer.listen(httpPortNumber);
        console.log('http server listening for requests on http://%s:%d', ipAddress || 'localhost', httpPortNumber);
    },
    startHTTPS: function () {
        if (privateKey && certificate) {
            httpsServer.listen(httpsPortNumber);
            console.log('https server listening for requests on https://%s:%d', ipAddress || 'localhost', httpsPortNumber);
        } else {
            console.error('No ssl certificates found. Cannot start https server.')
        }
    }
};
