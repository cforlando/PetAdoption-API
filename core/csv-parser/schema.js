var fs = require('fs'),
    path = require('path'),

    csv = require('csv'),
    _ = require('lodash'),

    dump = require('../../lib/dump'),

    __dirname = process.cwd(), //__dirname || path.resolve('./'),
    cwd = __dirname,
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
    console.log('sanitizing schema: %s', dump(schemaData));

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

    console.log('sanitized schema: %j', newSchema);
    return newSchema;
}

function sanitizeSchemaForEntry(schemaData) {
    console.log('sanitizing schema: %s', dump(schemaData));

    var newSchema = {},
        fieldName,
        fieldTypeDef,
        fieldPrettyName,
        fieldExample;
    _.forEachRight(schemaData, function (fieldMeta, index, arr) {
        if (index == 0) return; //skip the field labels

        fieldName = fieldMeta[1];
        fieldTypeDef = fieldMeta[2];
        fieldPrettyName = fieldMeta[3];
        fieldExample = fieldMeta[5];
        if (fieldMeta[1] && fieldMeta[2]) {
            if (fieldTypeDef == 'Integer') fieldTypeDef = 'Number';
            fieldTypeDef = fieldTypeDef.charAt(0).toUpperCase() + fieldTypeDef.slice(1);
            newSchema[fieldName] = {
                key : fieldName,
                type: fieldTypeDef,
                prettyName : fieldPrettyName,
                example : fieldExample
            };
        }
    });

    console.log('sanitized schema: %j', newSchema);
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
        _options.writePathV2 = path.resolve(_options.writeDir, _options.schemaName + '.v2.json');
        fs.readFile(_options.readPath, 'utf8', function (err, fileContent) {
            csv.parse(fileContent, function (err, schemaCSVData) {
                var formattedSchema = sanitizeSchema(schemaCSVData);
                var formattedEntrySchema = sanitizeSchemaForEntry(schemaCSVData);
                if(_options.cache === true){
                    fs.writeFile(_options.writePath, JSON.stringify(formattedSchema), function (err) {
                        if (err) throw err;
                        fs.writeFile(_options.writePathV2, JSON.stringify(formattedEntrySchema), function(err){
                            if (err) throw err;
                            _options.done.apply(_options.context, [formattedSchema, _options]);
                        })
                    })
                } else {
                    _options.done.apply(_options.context, [formattedSchema, _options]);
                }
            });
        });

    }
};