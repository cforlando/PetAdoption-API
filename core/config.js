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
    assetsDomain : process.env.assetsDomain || localJSON.assetsDomain || "http://localhost:8080",
    isDevelopment : !!process.env.isDevelopment || localJSON.isDevelopment || false,
    port : process.env.port || localJSON.port || '8080',
    httpsPort : process.env.httpsPort || localJSON.httpsPort || '8443',

    aws_access_key_id : process.env.aws_access_key_id || localJSON.aws_access_key_id || '',
    aws_secret_access_key : process.env.aws_secret_access_key || localJSON.aws_secret_access_key || '',

    s3_prod_bucket_name: process.env.s3_prod_bucket_name || localJSON.s3_prod_bucket_name || "prod",
    s3_dev_bucket_name: process.env.s3_dev_bucket_name || localJSON.s3_dev_bucket_name || "dev",
    s3_test_bucket_name: process.env.s3_test_bucket_name || localJSON.s3_test_bucket_name || "test",

    google_client_id : process.google_client_id || localJSON.google_client_id || 'n/a',
    google_client_secret : process.google_client_secret || localJSON.google_client_secret || 'n/a',

    mongo_username: process.env.mongo_username || localJSON.mongo_username,
    mongo_password: process.env.mongo_password || localJSON.mongo_password,
    mongo_domain: process.env.mongo_domain || localJSON.mongo_domain || 'domain',
    mongo_port: process.env.mongo_port || localJSON.mongo_port,
    mongo_database: process.env.mongo_database || localJSON.mongo_database || 'local'
};


module.exports = config;
