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

    var newModel = [{
            key: 'images',
            valType: '[Image]',
            defaultVal: ['http://placehold.it/500x500', 'http://placehold.it/720x480', 'http://placehold.it/480x480'],
            example: ['http://placehold.it/500x500', 'http://placehold.it/720x480', 'http://placehold.it/480x480']
        }],
        columnIndices = {
            name: 1,
            fieldLabel: 2,
            type: 3,
            description: 4,
            default: 5,
            required: 6,
            example: 7,
            note: 8
        };
    _.forEachRight(csvModelData, function (csvRow, rowIndex, arr) {
        if (rowIndex == 0) return; //skip the field labels

        var _modelPropData = {};
        if (csvRow[columnIndices['name']] && csvRow[columnIndices['type']]) {
            _.forEach(columnIndices, function (columnIndex, columnIndexName, indices) {
                switch (columnIndexName) {
                    case 'type':
                        if (csvRow[columnIndex].match(/integer/i)) {
                            _modelPropData['valType'] = 'Number';
                        } else {
                            _modelPropData['valType'] = _.capitalize(csvRow[columnIndex]);
                        }
                        break;
                    case 'default':
                        _modelPropData['defaultVal'] = csvRow[columnIndex];
                        break;
                    case 'name':
                        _modelPropData['key'] = csvRow[columnIndex];
                        break;
                    default:
                        _modelPropData[columnIndexName] = csvRow[columnIndex];
                        break;
                }
            });
            if (_modelPropData['key'].match(/(lostGeoL|shelterGeoL)/)) {
                _modelPropData['defaultVal'] = csvRow[columnIndices.example] || 'Location';
                _modelPropData['valType'] = 'Location';
            }
            if (_modelPropData['valType'] == 'Date') {
                if (!moment(_modelPropData['defaultVal']).isValid()) {
                    _modelPropData['defaultVal'] = null;
                }
            }
            newModel.push(_modelPropData);
        }
    });

    console.log('sanitized model');
    // console.log('sanitized model: %j', newModel);
    return newModel;
}

/**
 *
 * @param {Object} data
 * @param {Object} optionsData
 * @param {Function} callback
 */
function _mergeOptionsAndModel(data, optionsData, callback) {
    var _modelsData = {};
    _.forEach(data, function (speciesProps, speciesName, models) {
        var mergedSpeciesProps = [];
        _.forEach(speciesProps, function (speciesPropData, index, props) {
            mergedSpeciesProps.push(
                _.defaults({
                    options: _.sortBy( optionsData[speciesName][speciesPropData.key] || [], function (option) {
                        return option;
                    })
                }, speciesPropData)
            );
        });
        _modelsData[speciesName] = mergedSpeciesProps;
    });
    callback.call(null, _modelsData);
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
                                async.eachOf(mergedModelsData, function(speciesData, speciesName, done){
                                    fs.writeFile(path.join(_options.writeDir, util.format('%s.%s.json', _options.cacheName, speciesName)), JSON.stringify(speciesData), function (err) {
                                        done(err)
                                    })
                                }, function(err){
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
