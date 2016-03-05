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
        readPath: path.resolve(cwd, 'tmp/CfO_Animal_Adoption_Test_Dataset - Sheet1.csv'),
        writeDir: path.resolve(cwd, 'core/mongodb/cache/'),
        cacheName: 'dataset.dog'
    };

function sanitizeCSV(csvData) {
    console.log('sanitizing dataset: %O', csvData);

    // imagesPath could be url such http://server.com/images/ (url must have trailing slash)
    var imagesPath = '',
        animalData,
        fieldName,
        pets = [],
        fields = csvData[0];
    _.forEachRight(csvData, function (animal, index, animalCollection) {
        if (index == 0) return; //skip the field labels
        animalData = {
            species: 'dog'
        };
        for (var fieldIndex = 1; fieldIndex < fields.length; fieldIndex++) {
            fieldName = fields[fieldIndex];
            switch (fieldName) {
                case 'action':
                    if(animal[fieldIndex] == 'Adopted') animalData['Available'] = true;
                    break;
                case 'date':
                    // date
                    animalData['intakeDate'] = (animal[fieldIndex])?new Date(animal[fieldIndex]):new Date();
                    break;
                case 'pet_name':
                    animalData['petName'] = animal[fieldIndex];
                    break;
                case 'text':
                    animalData['description'] = animal[fieldIndex];
                    break;
                case 'photo':
                    animalData['image'] = imagesPath + animal[fieldIndex];
                    animalData['images'] = [(imagesPath + animal[fieldIndex])];
                    break;
                default:
                    animalData[fieldName] = animal[fieldIndex];
            }
        }

        if(animalData && animalData['petName']){
            pets.push(animalData);
        }
    });

    console.log('sanitized datset: %O', pets);
    return pets;
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
        var _options = _.extend(defaults, options);
        _options.writePath = path.resolve(_options.writeDir, _options.cacheName + '.json');
        fs.readFile(_options.readPath, 'utf8', function (err, fileContent) {
            csv.parse(fileContent, function (err, schemaCSVData) {
                var optionsData = sanitizeCSV(schemaCSVData);
                if (_options.cache === true) {
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