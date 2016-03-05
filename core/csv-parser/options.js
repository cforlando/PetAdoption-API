var csv = require('csv'),
    fs = require('fs'),
    path = require('path'),
    cwd = path.resolve('./'),
    _ = require('lodash'),
    defaults = {
        done: function () {
            console.warn('parse() complete - No callback provided.')
        },
        context: null,
        readPath: path.resolve(cwd, 'tmp/CfO_Animal_Adoption_DB_Model - Dogs.csv'),
        writeDir: path.resolve(cwd, 'core/mongodb/cache/'),
        cacheName: 'options.dog'
    };

function sanitizeCSV(csvData) {
    console.log('sanitizing options: %O', csvData);

    var optionsData = {},
        fields = csvData[0];
    _.forEachRight(fields, function(field, index, collection){
        optionsData[field] = [];
    });
    _.forEachRight(csvData, function (option, index, options) {
        if (index == 0) return; //skip the field labels
        for (var i = 0; i < fields.length; i++){
            if(option[i]) optionsData[fields[i]].push(option[i]);
        }
    });

    console.log('sanitized options: %O', optionsData);
    return optionsData;
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
    parse: function(options) {
        var _options = _.extend(defaults, options);
        _options.writePath = path.resolve(_options.writeDir, _options.cacheName + '.json');
        fs.readFile(_options.readPath, 'utf8', function (err, fileContent) {
            csv.parse(fileContent, function (err, schemaCSVData) {
                var optionsData = sanitizeCSV(schemaCSVData);
                if(_options.cache === true){
                    fs.writeFile(_options.writePath, JSON.stringify(optionsData), function (err) {
                        if (err) throw err;
                        _options.done.apply(_options.context, [optionsData, _options]);
                    })
                } else {
                    _options.done.apply(_options.context, [optionsData, _options]);
                }
            });
        });

    }
};