var dotenv = require('dotenv');
var _ = require('lodash');

dotenv.config();


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
 * @property {String} GOOGLE_AUTH_CALLBACK
 * @property {String} GOOGLE_CLIENT_SECRET
 *
 * @property {String} MONGODb_URI
 */
var config = {
    DOMAIN: process.env.DOMAIN || "http://localhost:8080",
    DEVELOPMENT_ENV: !!process.env.DEVELOPMENT_ENV || false,
    PORT: process.env.PORT || '8080',
    HTTPS_PORT: process.env.HTTPS_PORT || '8443',
    SERVER_SESSION_SECRET: process.env.SERVER_SESSION_SECRET || 'pet-api',

    ASSETS_DOMAIN: process.env.ASSETS_DOMAIN || "http://localhost:8080",
    AWS_ACCESS_KEY_ID: process.env.BUCKETEER_AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID || '',
    AWS_SECRET_ACCESS_KEY: process.env.BUCKETEER_AWS_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY || '',

    S3_PROD_BUCKET_NAME: process.env.BUCKETEER_BUCKET_NAME || process.env.S3_BUCKET || process.env.S3_PROD_BUCKET_NAME || "prod",
    S3_DEV_BUCKET_NAME: process.env.S3_DEV_BUCKET_NAME || "dev",
    S3_TEST_BUCKET_NAME: process.env.S3_TEST_BUCKET_NAME || "test",

    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || 'n/a',
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || 'n/a',
    GOOGLE_AUTH_CALLBACK: process.env.GOOGLE_AUTH_CALLBACK || 'http://localhost:8080/auth/google/callback',
    GOOGLE_MAPS_KEY: process.env.GOOGLE_MAPS_KEY || '',

    MONGODb_URI: process.env.MONGODb_URI || 'mongodb://127.0.0.1/local'
};


module.exports = config;
