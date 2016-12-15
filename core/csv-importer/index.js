var fs = require('fs'),
    path = require('path'),
    url = require('url'),
    util = require('util'),

    _ = require('lodash'),
    async = require('async'),
    multer = require('multer'),

    config = require('../config'),
    csvReader = require('./reader'),
    Debuggable = require('../lib/debuggable');

function CSVImporter() {
    this.reader = csvReader;
}

CSVImporter.prototype = {

    /**
     *
     * @param {Function} [callback]
     */
    run: function (callback) {

        var self = this;
        this.reader.parseSpeciesProps({
            readPath: [
                path.resolve(process.cwd(), 'tmp/CfO_Animal_Adoption_DB_Model - Cats.csv'),
                path.resolve(process.cwd(), 'tmp/CfO_Animal_Adoption_DB_Model - Dogs.csv')
            ],
            cache: true,
            done: onSpeciesPropsParsed
        });

        function onSpeciesPropsParsed(speciesProps, options) {
            self.log('species props parsed');
            self.reader.parseOptions({
                cache: true,
                readPath: [
                    path.resolve(process.cwd(), 'tmp/CfO_Animal_Adoption_DB_Options - Small Animals.csv'),
                    path.resolve(process.cwd(), 'tmp/CfO_Animal_Adoption_DB_Options - Rabbits.csv'),
                    path.resolve(process.cwd(), 'tmp/CfO_Animal_Adoption_DB_Options - Reptiles.csv'),
                    path.resolve(process.cwd(), 'tmp/CfO_Animal_Adoption_DB_Options - Birds.csv'),
                    path.resolve(process.cwd(), 'tmp/CfO_Animal_Adoption_DB_Options - Dogs.csv'),
                    path.resolve(process.cwd(), 'tmp/CfO_Animal_Adoption_DB_Options - Cats.csv')
                ],
                done: onOptionsParsed
            })
        }

        function onOptionsParsed() {
            self.log('options parsed');
            self.reader.parseDataset({
                cache: true,
                done: onDatasetParsed
            });
        }

        function onDatasetParsed(petCollection, options) {
            self.log('dataset parsed');
            console.log('done parsing csv data');
            if (callback) callback(petCollection);
        }
    }
};

_.extend(CSVImporter.prototype, Debuggable.prototype);

module.exports = CSVImporter;
