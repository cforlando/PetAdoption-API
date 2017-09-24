var fs = require('fs');
var path = require('path');
var url = require('url');
var util = require('util');

var _ = require('lodash');
var async = require('async');
var multer = require('multer');
var log = require('debug')('pet-api:csv-importer');

var config = require('../config');
var csvReader = require('./reader');

function CSVImporter() {
    this.reader = csvReader;
    this.log = log;
}

CSVImporter.prototype = {

    /**
     *
     * @returns {Promise.<pets>}
     */
    run: function () {

        var self = this;
        return this.reader.parseSpeciesProps({
                readPath: [
                    path.resolve(process.cwd(), 'tmp/CfO_Animal_Adoption_DB_Model - Cats.csv'),
                    path.resolve(process.cwd(), 'tmp/CfO_Animal_Adoption_DB_Model - Dogs.csv')
                ],
                cache: true
            })
            .then(function () {
                self.log('species props parsed');
                return self.reader.parseOptions({
                    cache: true,
                    readPath: [
                        path.resolve(process.cwd(), 'tmp/CfO_Animal_Adoption_DB_Options - Small Animals.csv'),
                        path.resolve(process.cwd(), 'tmp/CfO_Animal_Adoption_DB_Options - Rabbits.csv'),
                        path.resolve(process.cwd(), 'tmp/CfO_Animal_Adoption_DB_Options - Reptiles.csv'),
                        path.resolve(process.cwd(), 'tmp/CfO_Animal_Adoption_DB_Options - Birds.csv'),
                        path.resolve(process.cwd(), 'tmp/CfO_Animal_Adoption_DB_Options - Dogs.csv'),
                        path.resolve(process.cwd(), 'tmp/CfO_Animal_Adoption_DB_Options - Cats.csv')
                    ]
                })

            })
            .then(function () {
                self.log('options parsed');
                return self.reader.parseDataset({cache: true});
            })
            .then(function (petCollection) {
                self.log('done parsing csv data');
                return petCollection
            });
    }
};

module.exports = CSVImporter;
