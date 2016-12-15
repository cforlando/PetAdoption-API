var fs = require('fs'),
    path = require('path'),
    util = require('util'),
    url = require('url'),

    csv = require('csv'),
    _ = require('lodash'),

    config = require('../../config'),
    Cache = require('../../lib/cache'),

    defaults = {
        done: function () {
            console.warn('parse() complete - No callback provided.')
        },
        context: null,
        readPath: path.resolve(process.cwd(), 'tmp/CfO_Animal_Adoption_Test_Dataset - Sheet1.csv'),
        writeDir: path.resolve(process.cwd(), 'data/'),
        cacheName: 'dataset'
    };


function parseCSVDataset(csvData) {
    console.log('sanitizing dataset');

    // imagesPath could be url such http://server.com/images/ (url must have trailing slash)
    var imagesPath,
        pets = [],
        fieldNameMap = csvData[0];

    _.forEachRight(csvData, function (animalData, index) {
        if (index == 0) return; //skip the field labels


        var animalProps = {
            species: (function (animalData) {
                var result = 'dog';
                _.forEach(animalData, function (fieldInfo) {
                    if (/cat/i.test(fieldInfo)) {
                        result = 'cat';
                        return false;
                    }
                });
                return result;
            })(animalData)
        };

        imagesPath = url.resolve(config.ASSETS_DOMAIN, '/images/pet/' + animalProps.species + '/');

        for (var fieldIndex = 1; fieldIndex < fieldNameMap.length; fieldIndex++) {

            switch (fieldNameMap[fieldIndex]) {
                case 'action':
                    animalProps['adoptable'] = !/adopted/i.test(animalData[fieldIndex]);
                    break;
                case 'date':
                    // date
                    animalProps['intakeDate'] = (animalData[fieldIndex]) ? new Date(animalData[fieldIndex]) : new Date();
                    break;
                case 'pet_name':
                    animalProps['petName'] = animalData[fieldIndex];
                    break;
                case 'text':
                    animalProps['description'] = animalData[fieldIndex];
                    break;
                case 'photo':
                    // animalData['image'] = path.join(imagesPath, animal[fieldIndex]);
                    animalProps['images'] = [
                        imagesPath + animalData[fieldIndex],
                        imagesPath + animalData[fieldIndex]
                    ];
                    break;
                case 'notes':
                // I don't think this column is actually used
                // Could be used to supplement description, but this would rarely be needed.
                default:
                // ignore anything else for now
                // animalProps[fieldName] = animal[fieldIndex];
            }
        }
        pets.push(animalProps);
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
        var _options = _.defaults(options, defaults),
            cache = new Cache();

        // _options.writePath = path.resolve(_options.writeDir, util.format('%s.json', _options.cacheName));

        fs.readFile(_options.readPath, {encoding: 'utf8'}, function (readErr, petTestDataText) {
            if (readErr) throw readErr;
            csv.parse(petTestDataText, function (err, petTestCSVData) {
                var animalDataset = parseCSVDataset(petTestCSVData);

                console.log('dataset parsed');
                if (_options.cache === true) {
                    cache.save('json', animalDataset, {
                        dir: _options.writeDir,
                        name: _options.cacheName,
                        done: function () {
                            console.log('dataset saved');
                            _options.done.apply(_options.context, [animalDataset, _options]);
                        }
                    });
                } else {
                    _options.done.apply(_options.context, [animalDataset, _options]);
                }
            });
        });

    }
};