var fs = require('fs'),
    path = require('path'),

    _ = require('lodash'),

    defaults = {
        domain: 'http://localhost:8080',
        isDevelopment: true,
        port: '8080',
        httpsPort: '8443'
    },
    /**
     * @name config
     * @property {String} domain
     * @property {Boolean} isDevelopment
     * @property {String} port
     * @property {String} httpsPort
     */
    config = (function () {
        try {
            return _.defaults(JSON.parse(fs.readFileSync(path.join(process.cwd(), 'server.config.json'), 'utf8')), defaults);
        } catch (err) {
            console.error(err);
            return defaults
        }
    })();

module.exports = config;
