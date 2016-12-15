var fs = require('fs'),
    path = require('path'),

    _ = require('lodash'),
    moment = require('moment'),

    Debuggable = require('../../../core/lib/debuggable'),
    Species = require('../../../core/lib/species'),
    Animal = require('../../../core/lib/animal'),
    AnimalDB = require('../../../core/mongodb/animal');

describe("AnimalDatabase", function () {
    var testData = require('../../test-db-images'),
        tSpeciesProps = testData[0].getSpeciesProps(),
        animalDB,
        tSpecies = new Species('animal_db_test_species', tSpeciesProps),
        tAnimalProps = {
            petName: 'hello world',
            intakeDate: moment().subtract(5, 'days').toDate()
        },
        tSavedAnimalProps;

    beforeAll(function (done) {
        animalDB = new AnimalDB({
            debugLevel: Debuggable.PROD
        });
        animalDB.exec(done)
    });

    afterAll(function (done) {

        animalDB.stop(function () {
            done();
        });
    });

    describe("saveAnimal()", function () {

        it('saves an animal', function (done) {
            var tAnimal = new Animal(tSpecies, tAnimalProps);

            animalDB.saveAnimal(tAnimal, {
                isV1Format: false,
                complete: function (err, animalProps) {
                    if (err) throw err;
                    tSavedAnimalProps = animalProps;
                    expect(tSavedAnimalProps).not.toBeUndefined();
                    var tSavedAnimal = new Animal(tSpecies, tSavedAnimalProps);
                    expect(tSavedAnimal.getValue('petName')).toEqual(tAnimalProps.petName);
                    done();
                }
            })
        });

        it('assigns a petId to the animal', function (done) {
            var tAnimal = new Animal(tSpecies, tAnimalProps);

            animalDB.saveAnimal(tAnimal, {
                isV1Format: false,
                complete: function (err, animalProps) {
                    if (err) throw err;
                    tSavedAnimalProps = animalProps;
                    expect(tSavedAnimalProps.petId).not.toBeUndefined();
                    done();
                }
            })

        })
    });

    describe("findAnimals()", function () {
        var animals;

        beforeAll(function (done) {
            var tAnimal = new Animal(tSpecies, tAnimalProps);
            animalDB.saveAnimal(tAnimal, {
                isV1Format: false,
                complete: function (err, result) {
                    if (err) throw err;
                    done();
                }
            })
        });

        it("returns previously saved animals", function (done) {
            var tQueryAnimal = new Animal(tSpecies, tAnimalProps),
                queryData = tQueryAnimal.toQuery();
            animalDB.findAnimals(queryData, {
                isV1Format: false,
                complete: function (err, result) {
                    if (err) throw err;
                    animals = result;
                    expect(animals.length > 0).toBe(true, "previously saved test animal should be returned");
                    expect(animals[0].petId).not.toBeUndefined('each animal in responseFormat should have a defined petId');
                    expect(animals[0].petName).toEqual(tAnimalProps.petName);
                    expect(animals[0].intakeDate).toEqual(tAnimalProps.intakeDate.toISOString());
                    done();
                }
            });
        });

        it("does not return previously saved animals that don't match query", function (done) {
            animalDB.findAnimals({
                intakeDate: new Date()
            }, {
                isV1Format: false,
                complete: function (err, result) {
                    if (err) throw err;
                    expect(result.length === 0).toBe(true);
                    done();
                }
            })
        });
    });

    it("can find, edit, then save an animal", function (done) {
        animalDB.findAnimals(tAnimalProps, {
            isV1Format: false,
            complete: function (err, animals) {
                if (err) throw err;
                expect(animals.length > 0).toBe(true, 'an animal should be returned from previous tests');
                var aAnimal = new Animal(tSpecies, animals[0]);
                aAnimal.setValue('sex', 'female');

                animalDB.saveAnimal(aAnimal, {
                    isV1Format: false,
                    complete: function (err, savedAnimal) {
                        if (err) throw err;
                        expect(savedAnimal.sex).toMatch('female');
                        done();
                    }
                })
            }
        });
    });

    describe("removeAnimal()", function () {

        describe("tests", function () {

            it("are initialized correctly", function () {
                expect(tSavedAnimalProps).not.toBeUndefined('animal was not returned after save');
                expect(tSavedAnimalProps.petId).not.toBeUndefined('petId was not set after save');
            })

        });

        it('removes an animal', function (done) {
            var tAnimal = new Animal(tSpecies, tSavedAnimalProps);

            animalDB.removeAnimal(tAnimal, {
                complete: function (err, removeData) {
                    if (err) throw err;
                    expect(removeData.result).toMatch('success');
                    done();
                }
            })
        })
    });

});
