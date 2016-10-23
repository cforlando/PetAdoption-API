var fs = require('fs'),
    path = require('path'),

    _ = require('lodash');


var localJSON = (function () {
    try {
        return JSON.parse(fs.readFileSync(path.join(process.cwd(), './.env.json')));
    } catch (e) {
        console.error(e);
        return {};
    }
})();

/**
 * @name config
 * @property {String} domain
 * @property {Boolean} isDevelopment Setting this value to anything yields true
 * @property {String} port
 * @property {String} httpsPort
 * @property {String} google_client_id
 * @property {String} google_client_secret
 * @property {String} mongo_username
 * @property {String} mongo_password
 * @property {String} mongo_domain
 * @property {String} mongo_port
 * @property {String} mongo_database
 */
var config = {
    domain : process.env.domain || localJSON.domain || "http://localhost:8080",
    isDevelopment : !!process.env.isDevelopment || localJSON.isDevelopment || false,
    port : process.env.port || localJSON.port || '8080',
    httpsPort : process.env.httpsPort || localJSON.httpsPort || '8443',

    google_client_id : process.google_client_id || localJSON.google_client_id || 'n/a',
    google_client_secret : process.google_client_secret || localJSON.google_client_secret || 'n/a',

    mongo_username: process.env.mongo_username || localJSON.mongo_username,
    mongo_password: process.env.mongo_password || localJSON.mongo_password,
    mongo_domain: process.env.mongo_domain || localJSON.mongo_domain || 'domain',
    mongo_port: process.env.mongo_port || localJSON.mongo_port,
    mongo_database: process.env.mongo_database || localJSON.mongo_database || 'local'
};


module.exports = config;
