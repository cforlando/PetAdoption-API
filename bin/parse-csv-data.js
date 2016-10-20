/**
 * Created by kah8br on 10/18/16.
 */

var fs = require('fs'),
    path = require('path'),
    url = require('url'),
    util = require('util'),

    _ = require('lodash'),
    async = require('async'),
    multer = require('multer'),

    config = require('../core/config'),
    csvReader = require('../core/csv-parser'),
    Debuggable = require('../core/lib/debuggable'),
    dump = require('../lib/dump');

function Parser(){

    var self = this;


    this.run = function(){

        csvReader.parseSchema({
            readPath: [
                path.resolve(process.cwd(), 'tmp/CfO_Animal_Adoption_DB_Model - Cats.csv'),
                path.resolve(process.cwd(), 'tmp/CfO_Animal_Adoption_DB_Model - Dogs.csv')
            ],
            cache: true,
            done: onSchemaParsed
        });


        function onSchemaParsed() {
            csvReader.parseModel({
                readPath: [
                    path.resolve(process.cwd(), 'tmp/CfO_Animal_Adoption_DB_Model - Cats.csv'),
                    path.resolve(process.cwd(), 'tmp/CfO_Animal_Adoption_DB_Model - Dogs.csv')
                ],
                cache: true,
                done: onModelsParsed
            });
        }

        function onModelsParsed(formattedSchema, options) {
            self.log('schema parsed');
            csvReader.parseOptions({
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
            csvReader.parseDataset({
                cache: true,
                done: onDatasetParsed
            });
        }

        function onDatasetParsed(petCollection, options) {
            self.log('dataset parsed');
            console.log('done parsing csv data');
        }
    };
}

_.extend(Parser.prototype, Debuggable.prototype);

var parser = new Parser();

parser.run();
