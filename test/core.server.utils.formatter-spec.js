var _ = require('lodash'),
    expect = require('expect.js'),

    tHelper = require('./helper')._global,
    Debuggable = require('../core/lib/debuggable'),
    DBFormatter = require('../core/server/utils/formatter'),
    APIDatabase = require('../core/mongodb'),
    Species = require('../core/lib/species'),
    Animal = require('../core/lib/animal'),

    dbImages = tHelper.getTestDBImages();

describe("Formatter", function () {
    var testDBFormatter = new DBFormatter(),

        defaultSpeciesProps = dbImages[0].getSpeciesProps(),

        // only test props that have options and are a String or Boolean type
        defaultTestProps = defaultSpeciesProps.filter(function (speciesPropData) {
            return speciesPropData.options
                && (speciesPropData.valType == 'String' || speciesPropData.valType == 'Boolean')
                && speciesPropData.options.length > 0
        }),

        testSpecies = new Species('test_species', defaultTestProps);

    describe("formatAnimal()", function () {
        var testAnimal = new Animal(testSpecies, {});

        it("correct creates and formats animal fields", function () {
            var formattedAnimal = testDBFormatter.formatAnimal(defaultSpeciesProps, testAnimal.toObject(), {
                createMissingFields: true,
                populateEmptyFields: true
            });

            _.forEach(defaultTestProps, function (testPropData) {
                expect(formattedAnimal[testPropData.key].val).not.to.be(undefined);
            });
        });

        it("correct formats pre-created animal fields", function () {
            var testAnimalWithProps = new Animal(testSpecies, {}),
                formattedAnimal = testDBFormatter.formatAnimal(defaultSpeciesProps, testAnimalWithProps.toObject(), {
                    populateEmptyFields: true
                });

            _.forEach(testAnimalWithProps.toObject(), function (testAnimalPropVal, testAnimalPropName) {
                expect(formattedAnimal[testAnimalPropName]).not.to.be(undefined, testAnimalPropName + ' should not be undefined');
                expect(formattedAnimal[testAnimalPropName]).not.to.eql(null);

                // non auto-populated values should remain undefined unless specified
                // species is auto-populated so skip it
                if (!_.includes(['species'], testAnimalPropName)) {
                    expect(formattedAnimal[testAnimalPropName].val).to.be(undefined);
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
            var formattedTestImagesArray = testDBFormatter.formatImagesArray(testImagesArray);

            _.forEach(formattedTestImagesArray, function (imageURL) {
                expect(imageURL).to.match(/^http(s)?:\/\//)
            });
        });
    });


    describe.only("formatDB()", function () {
        var apiDatabase;

        before(function (done) {
            apiDatabase = new APIDatabase({
                debugLevel: Debuggable.PROD,
                preset: [],
                collectionNamePrefix: 'test_formatter_'
            });

            apiDatabase
                .uploadDBImages(dbImages)
                .then(function () {
                    // wrap function to handle arguments
                    done();
                })
                .catch(done)
        });

        after(function (done) {
            apiDatabase.clearAnimals()
                .then(apiDatabase.stop.bind(apiDatabase))
                .then(done)
                .catch(done)
        });

        it("formats an entire database", function (done) {
            function checkAnimal(animalData, speciesProps) {
                speciesProps.forEach(function (testPropData) {
                    if (!animalData[testPropData.key]) {
                        throw new Error("invalid prop: " + testPropData.key);
                    }
                    expect(animalData[testPropData.key].val).not.to.be(undefined, 'value for ' + testPropData.key + 'should be defined');
                });
            }

            function checkAnimals(speciesName, speciesProps) {
                return new Promise(function (resolve, reject) {
                    apiDatabase.findAnimals({
                        species: speciesName
                    }, {
                        complete: function (err, animals) {
                            animals.forEach(function (formattedAnimal) {
                                checkAnimal(formattedAnimal, speciesProps);
                            });
                            err ? reject(err) : resolve();
                        }
                    })
                });
            }

            var dbTests = dbImages.map(function (dbImage) {
                return new Promise(function (resolve, reject) {
                    testDBFormatter.formatDB(apiDatabase, {
                        createMissingFields: true,
                        populateEmptyFields: true,
                        complete: function () {
                            checkAnimals(dbImage.getSpeciesName(), dbImage.getSpeciesProps())
                                .then(resolve)
                                .catch(reject)
                        }
                    });
                })
            });

            Promise
                .all(dbTests)
                .then(function () {
                    // wrap done to handle args
                    done()
                })
                .catch(done)
        })
    })
});