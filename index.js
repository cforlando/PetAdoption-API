var config = require('./core/config'),
    ipAddress = (process.env.OPENSHIFT_NODEJS_IP) ? process.env.OPENSHIFT_NODEJS_IP : null,
    portNumber = normalizePort(process.env.OPENSHIFT_NODEJS_PORT || process.env.PORT || process.env.port || config.defaultPort),
    server = require('./core/server');

server.app.set('port', portNumber);

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

console.log('server listening for requests on port: %s:%d', ipAddress, portNumber);
server.app.listen(portNumber, ipAddress);