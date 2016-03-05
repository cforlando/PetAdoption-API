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
        writeDir: path.resolve(cwd, 'core/mongodb/schemas/'),
        schemaName: 'animal'
    };

function sanitizeSchema(schemaData) {
    console.log('sanitizing schema: %O', schemaData);

    var newSchema = {},
        fieldName,
        fieldTypeDef;
    _.forEachRight(schemaData, function (fieldMeta, index, arr) {
        if (index == 0) return; //skip the field labels

        fieldName = fieldMeta[1];
        fieldTypeDef = fieldMeta[2];
        if (fieldMeta[1] && fieldMeta[2]) {
            if (fieldTypeDef == 'Integer') fieldTypeDef = 'Number';
            fieldTypeDef = fieldTypeDef.charAt(0).toUpperCase() + fieldTypeDef.slice(1);
            newSchema[fieldName] = {type: fieldTypeDef};
        }
    });

    console.log('sanitized schema: %O', newSchema);
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
    parse: function(options) {
        var _options = _.extend(defaults, options);
        _options.writePath = path.resolve(_options.writeDir, _options.schemaName + '.json');
        fs.readFile(_options.readPath, 'utf8', function (err, fileContent) {
            csv.parse(fileContent, function (err, schemaCSVData) {
                var formattedSchema = sanitizeSchema(schemaCSVData);
                if(_options.cache === true){
                    fs.writeFile(_options.writePath, JSON.stringify(formattedSchema), function (err) {
                        if (err) throw err;
                        _options.done.apply(_options.context, [formattedSchema, _options]);
                    })
                } else {
                    _options.done.apply(_options.context, [formattedSchema, _options]);
                }
            });
        });

    }
};