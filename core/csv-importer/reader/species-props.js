var fs = require('fs'),
    path = require('path'),
    util = require('util'),

    async = require('async'),
    csv = require('csv'),
    _ = require('lodash'),
    moment = require('moment'),

    helperUtils = require('./helper-utils'),

    __dirname = process.cwd(), //__dirname || path.resolve('./'),
    cwd = __dirname,
    defaults = {
        context: null,
        readPath: [
            path.resolve(process.cwd(), 'tmp/CfO_Animal_Adoption_DB_Model - Cats.csv'),
            path.resolve(process.cwd(), 'tmp/CfO_Animal_Adoption_DB_Model - Dogs.csv')
        ],
        writeDir: path.resolve(cwd, 'data/'),
        cacheName: 'props'
    };

function parseModelCSV(csvModelData) {
    console.log('sanitizing model');

    var speciesProps = [{
            key: 'images',
            valType: '[Image]',
            defaultVal: ['http://placehold.it/500x500', 'http://placehold.it/720x480', 'http://placehold.it/480x480'],
            example: ['http://placehold.it/500x500', 'http://placehold.it/720x480', 'http://placehold.it/480x480']
        }],
        columnIndices = {
            key: 1,
            fieldLabel: 2,
            valType: 3,
            description: 4,
            defaultVal: 5,
            required: 6,
            example: 7,
            note: 8
        };

    console.log('sanitized model');
    // console.log('sanitized model: %j', newModel);
    return _.reduce(csvModelData, function (speciesProps, csvRow, rowIndex) {
        if (rowIndex == 0) return; //skip the first row which contains field labels
        if (!(csvRow[columnIndices['key']] && csvRow[columnIndices['valType']])) return; // skip invalid rows

        var speciesProp = {};
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
        if (speciesProp['key'].match(/(lostGeoL|shelterGeoL)/)) {
            speciesProp['defaultVal'] = csvRow[columnIndices.example] || 'Location';
            speciesProp['valType'] = 'Location';
        }
        if (speciesProp['valType'] == 'Date') {
            if (!moment(speciesProp['defaultVal']).isValid()) {
                speciesProp['defaultVal'] = null;
            }
        }
        speciesProps.push(speciesProp);
    }, []);
}

/**
 *
 * @param {Object} speciesDataCollection
 * @param {Object} optionsData
 * @param {Function} callback
 */
function _mergeOptionsAndModel(speciesDataCollection, optionsData, callback) {

    _.forEach(speciesDataCollection, function (speciesProps, speciesName) {

        _.forEach(speciesProps, function (speciesProp) {
            if (optionsData[speciesName][speciesProp.key]) {
                speciesProp.options = optionsData[speciesName][speciesProp.key];
            } else if (optionsData[speciesName]['breed'] && speciesProp.key.match(/breed/ig)) {
                speciesProp.options = optionsData[speciesName]['breed'].sort();
            } else {
                speciesProp.options = [];
            }
        });
    });

    callback.call(null, speciesDataCollection);
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
            data = {};

        async.each(fileList,
            function each(filePath, done) {

                function onParsed(err, schemaCSVData) {
                    var namespace = helperUtils.getTypeFromPath(filePath);
                    data[namespace] = parseModelCSV(schemaCSVData);
                    done();
                }

                helperUtils.download(filePath, function (err, content) {
                    if (err) throw err;
                    csv.parse(content, onParsed);
                });
            },
            function complete(error) {
                if (error) throw error;

                // merge in options

                require('./options').parse({
                    cache: true,
                    done: function (optionsData) {
                        _mergeOptionsAndModel(data, optionsData, function onMergeComplete(mergedModelsData) {
                            if (_options.cache === true) {
                                async.eachOf(mergedModelsData, function (speciesData, speciesName, done) {
                                    fs.writeFile(path.join(_options.writeDir, util.format('%s.%s.json', _options.cacheName, speciesName)), JSON.stringify(speciesData), function (err) {
                                        done(err)
                                    })
                                }, function (err) {
                                    if (err) throw err;
                                    _options.done.apply(_options.context, [mergedModelsData, _options]);
                                });
                            } else {
                                _options.done.apply(_options.context, [mergedModelsData, _options]);
                            }
                        });
                    }
                });

            });

    }
};
