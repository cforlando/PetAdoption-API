var _ = require('lodash');
var moment = require('moment');
var chai = require('chai');

var Debuggable = require('../core/lib/debuggable');
var Species = require('../core/lib/species');
var Animal = require('../core/lib/animal');
var AnimalDatabase = require('../core/mongodb/animal');

var tHelper = require('./helper')._global;
var expect = chai.expect;

describe("AnimalDatabase", function () {
    var testData = tHelper.getTestDbImages();
    var tSpeciesProps = testData[0].getSpeciesProps();
    var tSpecies = new Species('animal_db_test_species', tSpeciesProps);
    var tAnimalProps = {
        petName: 'hello world',
        intakeDate: moment().subtract(5, 'days').toDate()
    };
    var animalDb;

    before(function () {
        animalDb = new AnimalDatabase({debugLevel: Debuggable.PROD});
    });

    after(function () {
        return animalDb.stop();
    });

    describe("saveAnimal()", function () {

        it('saves an animal', function () {
            var tAnimal = new Animal(tSpecies, tAnimalProps);
            var tSavedAnimal;

            return animalDb.saveAnimal(tAnimal, {isV1Format: false})
                .then(function (animalProps) {

                    expect(animalProps).to.exist;

                    tSavedAnimal = new Animal(tSpecies, animalProps);

                    expect(tSavedAnimal.getValue('petName')).to.eql(tAnimalProps.petName);

                    return Promise.resolve();
                })
        });

        it('assigns a petId to the animal', function () {
            var tAnimal = new Animal(tSpecies, tAnimalProps);

            return animalDb.saveAnimal(tAnimal, {isV1Format: false})
                .then(function (animalProps) {

                    expect(animalProps.petId).to.exist;

                    return Promise.resolve();
                })

        })
    });

    describe("findAnimals()", function () {
        var animals;

        before(function () {
            var tAnimal = new Animal(tSpecies, tAnimalProps);

            return animalDb.saveAnimal(tAnimal, {isV1Format: false});
        });

        it("returns previously saved animals", function () {

            return animalDb.findAnimals(tAnimalProps, {isV1Format: false})
                .then(function (animals) {
                    expect(animals).to.have.length.above(0);

                    animals.forEach(function (animalData) {

                        expect(animalData.petId).to.exist;
                        expect(animalData.petName).to.eql(tAnimalProps.petName);
                        expect(animalData.intakeDate).to.eql(tAnimalProps.intakeDate.toISOString());

                    });

                    return Promise.resolve();
                });
        });

        it("does not return previously saved animals that don't match query", function () {

            return animalDb.findAnimals({intakeDate: new Date()}, {isV1Format: false})
                .then(function (result) {

                    expect(result).to.have.lengthOf(0);

                    return Promise.resolve();
                })
        });
    });

    describe("find, edit, and save task sequence", function () {
        var tSavedAnimalProps;

        before(function () {
            var tAnimal = new Animal(tSpecies, tAnimalProps);

            return animalDb.saveAnimal(tAnimal, {isV1Format: false})
                .then(function (animalProps) {

                    tSavedAnimalProps = animalProps;

                    return Promise.resolve();
                });
        });

        it("completes successfully", function () {

            return animalDb.findAnimals(tAnimalProps, {isV1Format: false})
                .then(function (animals) {
                    expect(animals).to.have.length.above(0);

                    var aAnimal = new Animal(tSpecies, animals[0]);

                    aAnimal.setValue('sex', 'female');

                    return animalDb.saveAnimal(aAnimal, {isV1Format: false})
                })
                .then(function (savedAnimal) {

                    expect(savedAnimal.sex).to.match(/female/);

                    return Promise.resolve();
                })
        });
    });

    describe("removeAnimal()", function () {
        var tSavedAnimalProps;

        before(function () {
            var tAnimal = new Animal(tSpecies, tAnimalProps);

            return animalDb.saveAnimal(tAnimal, {isV1Format: false})
                .then(function (animalProps) {
                    tSavedAnimalProps = animalProps;
                    return Promise.resolve();
                });
        });

        describe("tests", function () {

            it("are initialized correctly", function () {
                expect(tSavedAnimalProps).to.exist;
                expect(tSavedAnimalProps.petId).to.exist;
            })

        });

        it('removes an animal', function () {
            var tAnimal = new Animal(tSpecies, tSavedAnimalProps);

            return animalDb.removeAnimal(tAnimal)
                .then(function (removeData) {

                    expect(removeData.result).to.match(/success/);

                    return Promise.resolve();
                })
        })
    });

});
