var http = require('http'),
    https = require('https'),
    path = require('path'),
    fs = require('fs'),

    config = require('./core/config'),
    Server = require('./core/server'),
    Database = require('./core/mongodb'),
    Debuggable = require('./core/lib/debuggable'),
    serverUtils = require('./core/server/utils'),

    database = new Database({
        debugLevel: Debuggable.PROD
    }),
    server = new Server(database),

    ipAddress = (process.env.OPENSHIFT_NODEJS_IP) ? process.env.OPENSHIFT_NODEJS_IP : null,
    httpPortNumber = serverUtils.normalizePort(config.PORT),
    httpsPortNumber = serverUtils.normalizePort(config.HTTPS_PORT),
    privateKey  = (function(){
        try {
            return fs.readFileSync(path.resolve(__dirname, 'ssl/server.key'), 'utf8');
        } catch (err){
            console.error(err);
            return false;
        }
    })(),
    certificate = (function(){
        try {
            return fs.readFileSync(path.resolve(__dirname, 'ssl/server.crt'), 'utf8');
        } catch (err){
            console.error(err);
            return false
        }
    })(),
    credentials = {key: privateKey, cert: certificate},

    httpServer = http.createServer(server),
    httpsServer = https.createServer(credentials, server);


module.exports = {
    startHTTP : function(){
        httpServer.listen(httpPortNumber);
        console.log('http server listening for requests on http://%s:%d', ipAddress || 'localhost', httpPortNumber);
    },
    startHTTPS : function(){
        if (privateKey && certificate){
            httpsServer.listen(httpsPortNumber);
            console.log('https server listening for requests on https://%s:%d', ipAddress || 'localhost', httpsPortNumber);
        } else {
            console.error('No ssl certificates found. Cannot start https server.')
        }
    }
};
