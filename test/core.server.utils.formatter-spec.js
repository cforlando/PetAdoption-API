var _ = require('lodash');
var chai = require('chai');

var tHelper = require('./helper')._global;
var DbFormatter = require('../core/server/utils/formatter');
var APIDatabase = require('../core/mongodb');
var Species = require('../core/lib/species');
var Animal = require('../core/lib/animal');

var expect = chai.expect;
var dbImages = tHelper.getTestDbImages();

describe("Formatter", function () {
    var testDbFormatter = new DbFormatter(),

        defaultSpeciesProps = dbImages[0].getSpeciesProps(),

        // only test props that have options and are a String or Boolean type
        defaultTestProps = defaultSpeciesProps.filter(function (speciesPropData) {
            return speciesPropData.options
                && (speciesPropData.valType == 'string' || speciesPropData.valType == 'boolean')
                && speciesPropData.options.length > 0
        }),

        testSpecies = new Species('test_species', defaultTestProps);

    describe("formatAnimal()", function () {
        var testAnimal = new Animal(testSpecies, {});

        it("correct creates and formats animal fields", function () {
            var formattedAnimal = testDbFormatter.formatAnimal(defaultSpeciesProps, testAnimal.toObject(), {
                createMissingFields: true,
                populateEmptyFields: true
            });

            _.forEach(defaultTestProps, function (testPropData) {
                expect(formattedAnimal[testPropData.key].val).not.to.be.undefined;
            });
        });

        it("correct formats pre-created animal fields", function () {
            var testAnimalWithProps = new Animal(testSpecies, {}),
                formattedAnimal = testDbFormatter.formatAnimal(defaultSpeciesProps, testAnimalWithProps.toObject(), {
                    populateEmptyFields: true
                });

            _.forEach(testAnimalWithProps.toObject(), function (testAnimalPropVal, testAnimalPropName) {
                expect(formattedAnimal[testAnimalPropName]).to.exist;

                // non auto-populated values should remain undefined unless specified
                // species is auto-populated so skip it
                if (!_.includes(['species'], testAnimalPropName)) {
                    expect(formattedAnimal[testAnimalPropName].val).to.be.undefined;
                }
            });
        });
    });

    describe("formatImagesArray()", function () {

        it("formats an array of relative urls to absolute urls", function () {
            var testImagesArray = [
                '/some/path/a',
                '/some/path/b',
                '/some/path/c'
            ];
            var formattedTestImagesArray = testDbFormatter.formatImagesArray(testImagesArray);

            _.forEach(formattedTestImagesArray, function (imageURL) {
                expect(imageURL).to.match(/^http(s)?:\/\//)
            });
        });
    });


    describe("formatDb()", function () {
        var apiDatabase;

        before(function () {
            apiDatabase = new APIDatabase({
                preset: [],
                collectionNamePrefix: 'test_formatter_'
            });

            return apiDatabase.uploadDbImages(dbImages)
        });

        after(function () {
            return apiDatabase.clearAnimals()
                .then(function () {
                    return apiDatabase.stop()
                })
        });

        it("formats an entire database", function () {
            var formatOptions = {
                createMissingFields: true,
                populateEmptyFields: true
            };

            return Promise.all(dbImages.map(function (dbImage) {
                var speciesProps = dbImage.getSpeciesProps();
                var speciesName = dbImage.getSpeciesName();

                return testDbFormatter.formatDb(apiDatabase, formatOptions)
                    .then(function () {
                        return apiDatabase.findAnimals({species: speciesName})
                    })
                    .then(function (animals) {

                        animals.forEach(function (formattedAnimal) {

                            speciesProps.forEach(function (testPropData) {

                                expect(formattedAnimal[testPropData.key]).to.exist;
                                expect(formattedAnimal[testPropData.key].val).to.exist;

                            });
                        });

                        return Promise.resolve();
                    })
            }));

        })
    })
});