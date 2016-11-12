var fs = require('fs'),
    path = require('path'),
    util = require('util'),

    async = require('async'),
    csv = require('csv'),
    _ = require('lodash'),

    helperUtils = require('./helper-utils'),

    defaults = {
        context: null,
        readPath: [
            path.resolve(process.cwd(), 'tmp/CfO_Animal_Adoption_DB_Model - Cats.csv'),
            path.resolve(process.cwd(), 'tmp/CfO_Animal_Adoption_DB_Model - Dogs.csv')
        ],
        writeDir: path.resolve(process.cwd(), 'data/'),
        schemaName: 'schema'
    };

function parseSchemaCSV(csvSchemaData) {
    console.log('sanitizing schema');
    var newSchema = {},
        columnIndices = {
            name: 1,
            fieldLabel: 2,
            type: 3,
            description: 4,
            default: 5,
            required: 6,
            example: 7,
            note : 8
        };
    _.forEachRight(csvSchemaData, function (csvRow, rowIndex, arr) {
        if (rowIndex == 0) return; //skip the field labels
        // console.log('reading schema line %s', util.inspect(csvRow, {colors: true}));

        if (csvRow[columnIndices['name']] && csvRow[columnIndices['type']]) {
            // console.log('parsing schema line %s', util.inspect(csvRow, {colors: true}));
            console.log('parsing schema line %d', rowIndex);
            _.forEach(columnIndices, function (columnIndex, columnIndexName, indices) {
                switch (columnIndexName) {
                    case 'type':
                        if (csvRow[columnIndex].match(/integer/i)) {
                            newSchema[csvRow[columnIndices['name']]] = {type: 'Number'};
                        } else {
                            newSchema[csvRow[columnIndices['name']]] = {type: _.capitalize(csvRow[columnIndex])};
                        }
                        break;
                    default:
                        break;
                }
            });
            newSchema['images'] = {type : ["String"]};
        }
    });

    // console.log('sanitized schema: %j', newSchema);
    console.log('sanitized schema');
    return newSchema;
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

        var fileList = _.isArray(_options.readPath) ? _options.readPath : [_options.readPath],
            schemaData = {};
        async.each(fileList,
            function each(filePath, done) {

                helperUtils.download(filePath, function (err, content) {
                    if (err) throw err;
                    csv.parse(content, function onParsed(err, csvData) {
                        var namespace = helperUtils.getTypeFromPath(filePath);
                        schemaData[namespace] = parseSchemaCSV(csvData);
                        fs.writeFile(path.resolve(_options.writeDir,
                            util.format('%s.%s.json', _options.schemaName, namespace)),
                            JSON.stringify(schemaData[namespace]),
                            function (err) {
                                if (err) throw err;
                                done(err);
                            });
                    });
                });

            },
            function done() {

                if (_options.cache === true) {
                    _options.writePath = path.resolve(_options.writeDir, _options.schemaName + '.json');
                    fs.writeFile(_options.writePath, JSON.stringify(schemaData), function (err) {
                        if (err) throw err;
                        _options.done.apply(_options.context, [schemaData, _options]);
                    })
                } else {
                    _options.done.apply(_options.context, [schemaData, _options]);
                }

            });

    }
};