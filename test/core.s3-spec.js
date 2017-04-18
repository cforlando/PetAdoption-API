var fs = require('fs');
var path = require('path');
var Buffer = require('buffer').Buffer;

var chai = require('chai');
var MemoryStream = require('memorystream');

var expect = chai.expect;
var config = require('../core/config');

describe.skip("S3Bucket", function () {
    console.error('internet connection required');
    var S3Bucket = require('../core/s3');
    var testS3Bucket;
    var testFileName = 'dog.png';
    var testFilePath = path.join(__dirname, 's3/', testFileName);

    before(function () {
        testS3Bucket = new S3Bucket(config.S3_TEST_BUCKET_NAME);
    });

    describe("saveReadableStream", function () {
        var fileReadStream = fs.createReadStream(testFilePath);
        var fileKey = path.join('test/path/', testFileName);

        it("saves a file to an s3 bucket", function (done) {

            return testS3Bucket.saveReadableStream(fileReadStream, fileKey)
                .then(function (result) {

                    expect(result).to.exist;
                    expect(result.Location).to.exist;

                    return Promise.resolve();
                });
        })
    });

    describe("getReadableStream", function () {

        before(function () {
            return testS3Bucket.saveReadableStream(fs.createReadStream(testFilePath), testFileName);
        });

        it("reads a file from an s3 bucket", function (done) {
            var testSaveStream = new MemoryStream();
            var fileBuffer;

            testS3Bucket.getReadableStream(testFileName)
                .then(function (readStream) {

                    readStream.pipe(testSaveStream)
                        .on('data', function (data) {
                            var chunkBuffer = new Buffer(data);

                            if (!fileBuffer) {
                                fileBuffer = chunkBuffer;
                            } else {
                                fileBuffer = Buffer.concat([fileBuffer, chunkBuffer]);
                            }
                        })
                        .on('finish', function () {
                            var originalFileSize = fs.statSync(testFilePath).size;
                            var savedFileSize = fileBuffer.length;

                            expect(originalFileSize).to.eql(savedFileSize);

                            done();
                        });
                })
                .catch(done);
        })
    })
});