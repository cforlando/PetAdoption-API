var fs = require('mz/fs');
var path = require('path');

var async = require('async');
var csv = require('csv');
var _ = require('lodash');
var log = require('debug')('pet-api:csv-importer:reader:options');

var helperUtils = require('./helper-utils');

var defaults = {
    readPath: [
        path.resolve(process.cwd(), 'tmp/CfO_Animal_Adoption_DB_Options - Small Animals.csv'),
        path.resolve(process.cwd(), 'tmp/CfO_Animal_Adoption_DB_Options - Rabbits.csv'),
        path.resolve(process.cwd(), 'tmp/CfO_Animal_Adoption_DB_Options - Reptiles.csv'),
        path.resolve(process.cwd(), 'tmp/CfO_Animal_Adoption_DB_Options - Birds.csv'),
        path.resolve(process.cwd(), 'tmp/CfO_Animal_Adoption_DB_Options - Dogs.csv'),
        path.resolve(process.cwd(), 'tmp/CfO_Animal_Adoption_DB_Options - Cats.csv')
    ],
    writeDir: path.join(process.cwd(), 'data/'),
    cacheName: 'options'
};

function parseOptionsCSV(csvData) {
    log('parsing csv options...');
    var csvLabelsRow = csvData[0];
    var optionsData = _.reduce(csvData, function (collection, csvRow, rowIndex) {
        if (rowIndex === 0) {
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
    log('parsed csv options');
    return optionsData;
}

module.exports = {

    /**
     *
     * @param options
     * @param {Object} [options.readPath]
     * @param {Object} [options.writePath]
     * @returns {{cat: Object[]?, dog: Object[]?, reptile: Object[]?}} an dictionary of options for each species property
     */
    parse: function (options) {
        var opts = _.defaults({}, options, defaults);
        var writePath = opts.writePath || path.resolve(opts.writeDir, opts.cacheName + '.json');
        var fileList = _.isArray(opts.readPath) ? opts.readPath : [opts.readPath];
        var speciesPropertyOptions = {};

        return Promise.all(fileList.map(function (filePath) {
                return helperUtils.download(filePath)
                    .then(function (content) {
                        return new Promise(function(resolve, reject){
                            csv.parse(content, function(err, csvData){
                                if (err){
                                    reject(err);
                                    return;
                                }

                                resolve(csvData);
                            })
                        })
                    })
                    .then(function onParsed(csvData) {
                        var namespace = helperUtils.getSpeciesNameFromPath(filePath);
                        speciesPropertyOptions[namespace] = parseOptionsCSV(csvData);
                    });

            }))
            .then(function () {
                if (opts.cache === true) {
                    fs.writeFile(writePath, JSON.stringify(speciesPropertyOptions))
                        .catch(function(err){
                            console.error(err);
                        })
                }

                return speciesPropertyOptions;
            });

    }
};