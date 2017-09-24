var fs = require('fs'),
    zlib = require('zlib'),

    AWS = require('aws-sdk'),
    _ = require('lodash'),

    config = require('../config');


/**
 *
 * @class S3Bucket
 * @param bucketName
 * @param [options]
 * @param {String} [options.aws_access_key_id]
 * @constructor
 */
function S3Bucket(bucketName, options) {
    var _options = _.defaults(options, {
        aws_access_key_id: config.AWS_ACCESS_KEY_ID,
        aws_secret_access_key: config.AWS_SECRET_ACCESS_KEY
    });

    AWS.config.accessKeyId = _options.aws_access_key_id;
    AWS.config.secretAccessKey = _options.aws_secret_access_key;
    this.bucketName = bucketName;
    this.s3 = new AWS.S3();
}

S3Bucket.prototype = {

    /**
     *
     * @param {ReadStream} readableStream
     * @param {String} key
     * @param {Function} callback
     * @returns {Promise}
     */
    saveReadableStream: function (readableStream, key) {
        var s3File = new AWS.S3({
            params: {
                Bucket: this.bucketName,
                Key: key
            }
        });

        return new Promise(function (resolve, reject) {
            s3File.upload({Body: readableStream}).send(function (err, result) {
                err ? reject(err) : resolve(result);
            })
        })
    },

    /**
     *
     * @param {String} key
     * @param {Function} callback
     * @returns {Promise}
     */
    getReadableStream: function (key) {
        var readableStream = this.s3.getObject({
            Bucket: this.bucketName,
            Key: key
        }).createReadStream();

        return new Promise.resolve(readableStream)
    }
};

module.exports = S3Bucket;