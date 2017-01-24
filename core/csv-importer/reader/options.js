var fs = require('fs'),
    path = require('path'),

    async = require('async'),
    csv = require('csv'),
    _ = require('lodash'),

    helperUtils = require('./helper-utils'),

    __dirname = process.cwd(), //__dirname || path.resolve('./'),
    cwd = __dirname,
    defaults = {
        done: function () {
            console.warn('parse() complete - No callback provided.')
        },
        context: null,
        readPath: [
            path.resolve(process.cwd(), 'tmp/CfO_Animal_Adoption_DB_Options - Small Animals.csv'),
            path.resolve(process.cwd(), 'tmp/CfO_Animal_Adoption_DB_Options - Rabbits.csv'),
            path.resolve(process.cwd(), 'tmp/CfO_Animal_Adoption_DB_Options - Reptiles.csv'),
            path.resolve(process.cwd(), 'tmp/CfO_Animal_Adoption_DB_Options - Birds.csv'),
            path.resolve(process.cwd(), 'tmp/CfO_Animal_Adoption_DB_Options - Dogs.csv'),
            path.resolve(process.cwd(), 'tmp/CfO_Animal_Adoption_DB_Options - Cats.csv')
        ],
        writeDir: path.resolve(cwd, 'data/'),
        cacheName: 'options'
    };

function parseOptionsCSV(csvData) {
    console.log('parsing csv options...');

    var csvLabelsRow = csvData[0],
        optionsData = _.reduce(csvData, function (collection, csvRow, rowIndex) {
            if (rowIndex == 0) {
                csvRow.forEach(function (fieldName) {
                    collection[_.camelCase(fieldName)] = [];
                });
            } else {
                for (var column = 0; column < csvLabelsRow.length; column++) {
                    if (csvRow[column]) {
                        var fieldName = csvLabelsRow[column];
                        collection[_.camelCase(fieldName)].push(csvRow[column]);
                    }
                }
            }
            return collection;
        }, {});
    console.log('parsed csv options');
    return optionsData;
}

module.exports = {
    /**
     *
     * @param options
     * @param {Function} options.done
     * @param {Object} [options.context]
     * @param {Object} [options.readPath]
     * @param {Object} [options.writePath]
     */
    parse: function (options) {
        var _options = _.defaults(options, defaults);
        _options.writePath = path.resolve(_options.writeDir, _options.cacheName + '.json');

        var fileList = _.isArray(_options.readPath) ? _options.readPath : [_options.readPath],
            optionsData = {};
        async.each(fileList,
            function each(filePath, done) {

                helperUtils.download(filePath, function (err, content) {
                    if (err) throw err;
                    csv.parse(content, function onParsed(err, csvData) {
                        var namespace = helperUtils.getTypeFromPath(filePath);
                        optionsData[namespace] = parseOptionsCSV(csvData);
                        done();
                    });
                });

            },
            function complete(error) {
                if (error) throw error;
                if (_options.cache === true) {
                    fs.writeFile(_options.writePath, JSON.stringify(optionsData), function (err) {
                        if (err) throw err;
                        _options.done.apply(_options.context, [optionsData, _options]);
                    })
                } else {
                    _options.done.apply(_options.context, [optionsData, _options]);
                }
            });

    }
};