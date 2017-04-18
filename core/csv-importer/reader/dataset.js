var path = require('path');
var util = require('util');
var url = require('url');

var fs = require('mz/fs');
var csv = require('csv');
var _ = require('lodash');
var log = require('debug')('pet-api:csv-importer:reader:dataset');

var config = require('../../config');
var Cache = require('../../lib/cache');

var defaults = {
    readPath: path.resolve(process.cwd(), 'tmp/CfO_Animal_Adoption_Test_Dataset - Sheet1.csv'),
    writeDir: path.resolve(process.cwd(), 'data/'),
    cacheName: 'dataset'
};


function parseCSVDataset(csvData) {
    log('sanitizing dataset');

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

    log('sanitized dataset');
    return pets;
}

module.exports = {
    /**
     *
     * @param options
     * @param {Object} options.readPath
     * @param {Object} options.writePath
     */
    parse: function (options) {
        log('dataset parsing');
        var _options = _.defaults(options, defaults);
        var cache = new Cache();
        var animalDataset;

        // _options.writePath = path.resolve(_options.writeDir, util.format('%s.json', _options.cacheName));

        return fs.readFile(_options.readPath, 'utf8')
            .then(function (petTestDataText) {
                return new Promise(function (resolve, reject) {
                    csv.parse(petTestDataText, function (err, petTestCSVData) {
                        if (err) {
                            reject(err);
                            return;
                        }
                        resolve(petTestCSVData);
                    })
                });
            })
            .then(function (petTestCSVData) {
                animalDataset = parseCSVDataset(petTestCSVData);

                log('dataset parsed');

                if (_options.cache === true) {
                    cache.save('json', animalDataset, {
                            dir: _options.writeDir,
                            name: _options.cacheName
                        })
                        .then(function(){
                            log('dataset saved');
                        })
                        .catch(function (err) {
                            console.error(err);
                        })
                }
            })
            .then(function () {
                return animalDataset;
            });
    }
};