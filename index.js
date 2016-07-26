var http = require('http'),
    https = require('https'),
    path = require('path'),
    fs = require('fs'),

    config = require('./core/config'),
    server = require('./core/server'),
    serverUtils = require('./core/server/utils'),

    ipAddress = (process.env.OPENSHIFT_NODEJS_IP) ? process.env.OPENSHIFT_NODEJS_IP : null,
    httpPortNumber = serverUtils.normalizePort(process.env.OPENSHIFT_NODEJS_PORT || process.env.PORT || process.env.port || config.defaultPort),
    httpsPortNumber = serverUtils.normalizePort(config.defaultHTTPSPort),
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

    httpServer = http.createServer(server.app),
    httpsServer = https.createServer(credentials, server.app);

httpServer.listen(httpPortNumber);
console.log('http server listening for requests on http://%s:%d', ipAddress || 'localhost', httpPortNumber);
if (privateKey && certificate){
    httpsServer.listen(httpsPortNumber);
    console.log('https server listening for requests on https://%s:%d', ipAddress || 'localhost', httpsPortNumber);
}