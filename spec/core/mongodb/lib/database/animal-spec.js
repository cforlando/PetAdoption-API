var fs = require('fs'),
    path = require('path'),

    _ = require('lodash'),
    moment = require('moment'),

    Debuggable = require('../../../../../core/lib/debuggable'),
    AnimalDB = require('../../../../../core/mongodb/lib/database/animal');

describe("AnimalDatabase", function () {
    var testData = require('../../../../test-db-images'),
        testAnimalProps = testData[0].getSpeciesProps(),
        animalDB,
        tAnimalProps = {
            petName: 'hello world',
            intakeDate: moment().subtract(5, 'days').toDate()
        },
        tSavedAnimal;

    beforeAll(function (done) {
        animalDB = new AnimalDB('test_animal', testAnimalProps, {
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

            animalDB.saveAnimal(tAnimalProps, {
                isV1Format: false,
                complete: function (err, result) {
                    if (err) throw err;
                    tSavedAnimal = result;
                    expect(tSavedAnimal).not.toBeUndefined();
                    expect(tSavedAnimal.petName).toEqual(tAnimalProps.petName);
                    done();
                }
            })
        });

        it('assigns a petId to the animal', function (done) {
            animalDB.saveAnimal(tAnimalProps, {
                isV1Format: false,
                complete: function (err, result) {
                    if (err) throw err;
                    tSavedAnimal = result;
                    expect(tSavedAnimal.petId).not.toBeUndefined();
                    done();
                }
            })

        })
    });

    describe("findAnimals()", function () {
        var animals;

        it("returns previously saved animals", function (done) {
            animalDB.findAnimals(tAnimalProps, {
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
                var aAnimal = animals[0];
                aAnimal.sex = 'female';

                animalDB.saveAnimal(aAnimal, {
                    isV1Format: false,
                    complete: function (err, savedAnimal) {
                        if (err) throw err;
                        expect(savedAnimal.sex).toEqual('female');
                        done();
                    }
                })
            }
        });
    });

    describe("removeAnimal()", function () {

        describe("tests", function () {

            it("are initialized correctly", function () {
                expect(tSavedAnimal).not.toBeUndefined('animal was not returned after save');
                expect(tSavedAnimal.petId).not.toBeUndefined('petId was not set after save');
            })

        });

        it('removes an animal', function (done) {

            animalDB.removeAnimal(tSavedAnimal, {
                complete: function (err, removeData) {
                    if (err) throw err;
                    expect(removeData.result).toEqual('success');
                    done();
                }
            })
        })
    });

});
