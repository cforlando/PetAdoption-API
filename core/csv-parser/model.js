var fs = require('fs'),
    path = require('path'),

    async = require('async'),
    csv = require('csv'),
    _ = require('lodash'),
    moment = require('moment'),

    helperUtils = require('./helper-utils'),
    dump = require('../../lib/dump'),

    __dirname = process.cwd(), //__dirname || path.resolve('./'),
    cwd = __dirname,
    defaults = {
        context: null,
        readPath: [
            path.resolve(process.cwd(), 'tmp/CfO_Animal_Adoption_DB_Model - Cats.csv'),
            path.resolve(process.cwd(), 'tmp/CfO_Animal_Adoption_DB_Model - Dogs.csv')
        ],
        writeDir: path.resolve(cwd, 'data/'),
        cacheName: 'models'
    };

function parseModelCSV(csvModelData) {
    // console.log('sanitizing model: %s', dump(modelData));
    console.log('sanitizing model');

    var newModel = {},
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
            if (_modelPropData['key'].match(/(lostGeoL|shelterGeoL)/)){
                _modelPropData['defaultVal'] = csvRow[columnIndices.example] || 'Location';
                _modelPropData['valType'] = 'Location';
            }
            if (_modelPropData['valType'] == 'Date'){
                if( !moment(_modelPropData['defaultVal']).isValid()){
                    _modelPropData['defaultVal'] = null;
                }
            }
            newModel[_modelPropData['key']] = _modelPropData;
        }
    });

    newModel['images'] = {
        key : 'images',
        valType : '[Image]',
        defaultVal : ['http://placehold.it/500x500', 'http://placehold.it/720x480', 'http://placehold.it/480x480'],
        example : ['http://placehold.it/500x500', 'http://placehold.it/720x480', 'http://placehold.it/480x480']
    };
    console.log('sanitized model');
    // console.log('sanitized model: %j', newModel);
    return newModel;
}

/**
 *
 * @param {Object} modelsData
 * @param {Object} optionsData
 * @param {Function} callback
 */
function _mergeOptionsAndModel(modelsData, optionsData, callback) {
    var _modelsData = {};
    _.forEach(modelsData, function (modelData, modelDataType, models) {
        _modelsData[modelDataType] = {};
        _.forEach(modelData, function (modelPropInfo, modelPropName, props) {
            _modelsData[modelDataType][modelPropName] = _.extend(modelPropInfo, {
                options: _.reverse((function () {
                    if (optionsData[modelDataType][modelPropName]) {
                        return optionsData[modelDataType][modelPropName];

                    } else if (optionsData[modelDataType]['breed'] && modelPropInfo['key'] && modelPropInfo['key'].match(/breed/ig)) {
                        return _.reverse(optionsData[modelDataType]['breed']);

                    } else {
                        return [];
                    }
                })())
            });
        })
    });
    callback.call(null, _modelsData);
}

module.exports = {
    /**
     *
     * @param options
     * @param {Function} options.done
     * @param {Object} options.context
     * @param {Object} options.readPath
     * @param {Object} options.writePath
     */
    parse: function (options) {
        var _options = _.defaults(options, defaults);
        _options.writePath = path.resolve(_options.writeDir, _options.cacheName + '.json');

        var fileList = _.isArray(_options.readPath) ? _options.readPath : [_options.readPath],
            modelsData = {};

        async.each(fileList,
            function each(filePath, done) {

                function onParsed(err, schemaCSVData) {
                    var namespace = helperUtils.getTypeFromPath(filePath);
                    modelsData[namespace] = parseModelCSV(schemaCSVData);
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
                        _mergeOptionsAndModel(modelsData, optionsData, function onMergeComplete(mergedModelsData) {
                            if (_options.cache === true) {
                                fs.writeFile(_options.writePath, JSON.stringify(mergedModelsData), function (err) {
                                    if (err) throw err;
                                    _options.done.apply(_options.context, [mergedModelsData, _options]);
                                })
                            } else {
                                _options.done.apply(_options.context, [mergedModelsData, _options]);
                            }
                        });
                    }
                });

            });

    }
};