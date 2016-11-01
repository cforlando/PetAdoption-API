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
 * @property {String} DOMAIN
 * @property {Boolean} DEVELOPMENT_ENV Setting this value to anything yields true
 * @property {String} PORT
 * @property {String} HTTPS_PORT
 * @property {String} [SERVER_SESSION_SECRET='pet-api]
 *
 * @property {String} ASSETS_DOMAIN Domain of image hosting resource (ie Amazon S3)
 * @property {String} AWS_ACCESS_KEY_ID
 * @property {String} AWS_SECRET_ACCESS_KEY
 *
 * @property {String} S3_PROD_BUCKET_NAME
 * @property {String} S3_DEV_BUCKET_NAME
 * @property {String} S3_TEST_BUCKET_NAME
 *
 * @property {String} GOOGLE_CLIENT_ID
 * @property {String} GOOGLE_CLIENT_SECRET
 *
 * @property {String} MONGODB_URI
 */
var config = {
    DOMAIN : process.env.DOMAIN || localJSON.DOMAIN || "http://localhost:8080",
    DEVELOPMENT_ENV : !!process.env.DEVELOPMENT_ENV || localJSON.DEVELOPMENT_ENV || false,
    PORT : process.env.PORT || localJSON.PORT || '8080',
    HTTPS_PORT : process.env.HTTPS_PORT || localJSON.HTTPS_PORT || '8443',
    SERVER_SESSION_SECRET: process.env.SERVER_SESSION_SECRET || localJSON.SERVER_SESSION_SECRET || 'pet-api',

    ASSETS_DOMAIN : process.env.ASSETS_DOMAIN || localJSON.ASSETS_DOMAIN || "http://localhost:8080",
    AWS_ACCESS_KEY_ID : process.env.BUCKETEER_AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID || localJSON.AWS_ACCESS_KEY_ID || '',
    AWS_SECRET_ACCESS_KEY : process.env.BUCKETEER_AWS_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY || localJSON.AWS_SECRET_ACCESS_KEY || '',

    S3_PROD_BUCKET_NAME: process.env.BUCKETEER_BUCKET_NAME || process.env.S3_BUCKET || process.env.S3_PROD_BUCKET_NAME || localJSON.S3_PROD_BUCKET_NAME || "prod",
    S3_DEV_BUCKET_NAME: process.env.S3_DEV_BUCKET_NAME || localJSON.S3_DEV_BUCKET_NAME || "dev",
    S3_TEST_BUCKET_NAME: process.env.S3_TEST_BUCKET_NAME || localJSON.S3_TEST_BUCKET_NAME || "test",

    GOOGLE_CLIENT_ID : process.GOOGLE_CLIENT_ID || localJSON.GOOGLE_CLIENT_ID || 'n/a',
    GOOGLE_CLIENT_SECRET : process.GOOGLE_CLIENT_SECRET || localJSON.GOOGLE_CLIENT_SECRET || 'n/a',

    MONGODB_URI: process.env.MONGODB_URI || localJSON.MONGODB_URI || 'mongodb://127.0.0.1/local'
};


module.exports = config;
