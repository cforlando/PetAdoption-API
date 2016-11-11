var fs = require('fs'),
    path = require('path'),
    Buffer = require('buffer').Buffer,

    MemoryStream = require('memorystream'),

    config = require('../../../core/config');

describe("S3Bucket", function () {
    pending('internet connection required');
    var S3Bucket = require('../../../core/s3'),
        testS3Bucket,
        testFileName = 'dog.png',
        testFilePath = path.join(__dirname, testFileName);

    beforeAll(function () {
        testS3Bucket = new S3Bucket(config.S3_TEST_BUCKET_NAME);
    });

    describe("saveReadableStream", function () {
        var fileReadStream = fs.createReadStream(testFilePath),
            fileKey = path.join('test/path/', testFileName);
        it("saves a file to an s3 bucket", function (done) {

            testS3Bucket.saveReadableStream(fileReadStream, fileKey, function (err, result) {
                if (err) throw err;
                expect(result).not.toBeUndefined();
                expect(result.Location).not.toBeUndefined();
                done();
            });
        })
    });

    describe("getReadableStream", function () {
        beforeAll(function (done) {
            testS3Bucket.saveReadableStream(fs.createReadStream(testFilePath), testFileName, function (err, result) {
                if (err) throw err;
                done();
            });
        });

        it("reads a file from an s3 bucket", function (done) {
            var testSaveStream = new MemoryStream(),
                fileBuffer;

            testS3Bucket.getReadableStream(testFileName, function (err, readStream) {
                if (err) throw err;
                readStream.pipe(testSaveStream)
                    .on('data', function (data) {
                        if (fileBuffer) {
                            var chunkBuffer = new Buffer(data);
                            fileBuffer = Buffer.concat([fileBuffer, chunkBuffer]);
                        } else {
                            fileBuffer = new Buffer(data);
                        }
                    })
                    .on('finish', function () {
                        var originalFileSize = fs.statSync(testFilePath).size,
                            savedFileSize = fileBuffer.length;
                        expect(originalFileSize).toEqual(savedFileSize);
                        done();
                    });
            });
        })
    })
});