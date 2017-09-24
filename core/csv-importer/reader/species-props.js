var fs = require('fs');
var path = require('path');
var util = require('util');

var log = require('debug')('pet-api:csv-importer:reader:species-props');
var async = require('async');
var csv = require('csv');
var _ = require('lodash');
var moment = require('moment');

var helperUtils = require('./helper-utils');

var defaults = {
    context: null,
    readPath: [
        path.resolve(process.cwd(), 'tmp/CfO_Animal_Adoption_DB_Model - Cats.csv'),
        path.resolve(process.cwd(), 'tmp/CfO_Animal_Adoption_DB_Model - Dogs.csv')
    ],
    writeDir: path.resolve(process.cwd(), 'data/'),
    cacheName: 'props'
};

function parseModelCSV(csvModelData) {
    /**
     * @name speciesProps
     * @description array of properties as defined by the csv. starts with array containing images property
     * @type {{key: String, valType: String, defaultVal: *, example: *}[]}
     */
    var speciesProps = [{
        key: 'images',
        valType: '[Image]',
        defaultVal: ['http://placehold.it/500x500', 'http://placehold.it/720x480', 'http://placehold.it/480x480'],
        example: ['http://placehold.it/500x500', 'http://placehold.it/720x480', 'http://placehold.it/480x480']
    }];

    /**
     * @name columnIndices
     * @description hardcoded indices as defined by the csv file. used for properly assigning values to each species prop
     * @type {Object}
     */
    var columnIndices = {
        key: 1,
        fieldLabel: 2,
        valType: 3,
        description: 4,
        defaultVal: 5,
        required: 6,
        example: 7,
        note: 8
    };

    return _.reduce(csvModelData, function (speciesProps, csvRow, rowIndex) {
        var speciesProp = {};
        //skip the first row which contains field labels
        if (rowIndex === 0) {
            return speciesProps;
        }
        // skip invalid rows
        if (!(csvRow[columnIndices['key']] && csvRow[columnIndices['valType']])) {
            return speciesProps
        }
        _.forEach(columnIndices, function (columnIndex, columnIndexName) {
            switch (columnIndexName) {
                case 'valType':
                    if (csvRow[columnIndex].match(/integer/i)) {
                        speciesProp['valType'] = 'Number';
                    } else {
                        speciesProp['valType'] = _.capitalize(csvRow[columnIndex]);
                    }
                    break;
                case 'defaultVal':
                    speciesProp['defaultVal'] = csvRow[columnIndex];
                    break;
                case 'key':
                    speciesProp['key'] = csvRow[columnIndex];
                    break;
                default:
                    speciesProp[columnIndexName] = csvRow[columnIndex];
                    break;
            }
        });

        switch (speciesProp['valType']) {
            case 'Date':
                if (!moment(speciesProp['defaultVal']).isValid()) {
                    speciesProp['defaultVal'] = null;
                }
                break;
            case 'Boolean':
                speciesProp['options'] = [true, false];
                if (_.isString(speciesProp['defaultVal'])){
                    speciesProp['defaultVal'] = /yes|true/i.test(speciesProp['defaultVal'])
                }
                if (_.isString(speciesProp['example'])){
                    speciesProp['example'] = /yes|true/i.test(speciesProp['example'])
                }
                break;
        }

        if (speciesProp['key'].match(/(lostGeoL|shelterGeoL)/)) {
            speciesProp['defaultVal'] = csvRow[columnIndices.example] || 'Location';
            speciesProp['valType'] = 'Location';
        }

        if (_.isString(speciesProp['required'])){
            speciesProp['required'] = /yes|true/i.test(speciesProp['required'])
        }

        speciesProps.push(speciesProp);
        return speciesProps;
    }, speciesProps);
}

/**
 *
 * @param {Object} speciesDataCollection
 * @param {Object} optionsData
 */
function mergeSpeciesOptions(speciesDataCollection, optionsData) {

    _.forEach(speciesDataCollection, function (speciesProps, speciesName) {

        _.forEach(speciesProps, function (speciesProp) {
            if (optionsData[speciesName][speciesProp.key]) {
                speciesProp.options = optionsData[speciesName][speciesProp.key];
            } else if (speciesProp.key.match(/breed/ig)) {
                speciesProp.options = optionsData[speciesName]['breed'].sort();
            } else {
                speciesProp.options = speciesProp.options || [];
            }
        });
    });

    return speciesDataCollection;
}

module.exports = {
    /**
     *
     * @param options
     * @param {Function} options.done
     * @param {Object} options.context
     * @param {String} options.readPath
     * @param {String} options.writeDir
     */
    parse: function (options) {
        var _options = _.defaults(options, defaults);

        var fileList = _.isArray(_options.readPath) ? _options.readPath : [_options.readPath],
            speciesSchemaDict = {};

        return Promise.all(fileList.map(function (filePath) {
                return helperUtils.download(filePath)
                    .then(function (content) {
                        return new Promise(function (resolve, reject) {
                            csv.parse(content, function (err, schemaCSVData) {
                                if (err) {
                                    reject(err);
                                    return;
                                }
                                resolve(schemaCSVData)
                            });
                        })
                    })
                    .then(function (schemaCSVData) {
                        var namespace = helperUtils.getSpeciesNameFromPath(filePath);
                        speciesSchemaDict[namespace] = parseModelCSV(schemaCSVData);
                    });
            }))
            .then(function () {
                // to merge in options
                return require('./options').parse({cache: true})
            })
            .then(function (optionsData) {
                mergeSpeciesOptions(speciesSchemaDict, optionsData);

                if (_options.cache === true) {
                    Promise.all(Object.keys(speciesSchemaDict).map(function (speciesName) {
                            var fileName = util.format('%s.%s.json', _options.cacheName, speciesName);
                            return fs.writeFile(path.join(_options.writeDir, fileName), JSON.stringify(speciesSchemaDict[speciesName]));
                        }))
                        .catch(function (err) {
                            console.error(err);
                        })
                }

                return speciesSchemaDict;
            });

    }
};
