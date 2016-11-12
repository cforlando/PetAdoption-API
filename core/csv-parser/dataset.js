var fs = require('fs'),
    path = require('path'),
    util = require('util'),

    csv = require('csv'),
    _ = require('lodash'),


    defaults = {
        done: function () {
            console.warn('parse() complete - No callback provided.')
        },
        context: null,
        readPath: path.resolve(process.cwd(), 'tmp/CfO_Animal_Adoption_Test_Dataset - Sheet1.csv'),
        writeDir: path.resolve(process.cwd(), 'data/'),
        cacheName: 'dataset.dog'
    };

function sanitizeTestDataCSV(csvData) {
    console.log('sanitizing dataset');

    // imagesPath could be url such http://server.com/images/ (url must have trailing slash)
    var imagesPath = '/images/pet/dog/',
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
                    // animalData['image'] = path.join(imagesPath, animal[fieldIndex]);
                    animalData['images'] = [path.join(imagesPath, animal[fieldIndex]), path.join(imagesPath, animal[fieldIndex])];
                    break;
                default:
                    animalData[fieldName] = animal[fieldIndex];
            }
        }

        if(animalData && animalData['petName']){
            pets.push(animalData);
        }
    });

    console.log('sanitized dataset');
    return pets;
}

module.exports = {
    /**
     *
     * @param options
     * @param {ParsedCallback} options.done
     * @param {Object} options.context
     * @param {Object} options.readPath
     * @param {Object} options.writePath
     */
    parse: function (options) {
        console.log('dataset parsing');
        var _options = _.defaults(options, defaults);
        _options.writePath = path.resolve(_options.writeDir, util.format('%s.json', _options.cacheName));
        fs.readFile(_options.readPath, {encoding: 'utf8'}, function (readErr, petTestDataText) {
            if(readErr) throw readErr;
            csv.parse(petTestDataText, function (err, petTestCSVData) {
                var petTestData = sanitizeTestDataCSV(petTestCSVData);
                console.log('dataset parsed');
                if (_options.cache === true) {
                    fs.writeFile(_options.writePath, JSON.stringify(petTestData), function (err) {
                        if (err) throw err;
                        console.log('dataset saved');
                        _options.done.apply(_options.context, [petTestData, _options]);
                    })
                } else {
                    console.log('dataset loaded');
                    _options.done.apply(_options.context, [petTestData, _options]);
                }
            });
        });

    }
};