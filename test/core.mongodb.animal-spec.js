var _ = require('lodash'),
    moment = require('moment'),
    expect = require('expect.js'),

    Debuggable = require('../core/lib/debuggable'),
    Species = require('../core/lib/species'),
    Animal = require('../core/lib/animal'),
    AnimalDatabase = require('../core/mongodb/animal'),

    tHelper = require('./helper')._global;

describe("AnimalDatabase", function () {
    var testData = tHelper.getTestDBImages(),
        tSpeciesProps = testData[0].getSpeciesProps(),
        animalDB,
        tSpecies = new Species('animal_db_test_species', tSpeciesProps),
        tAnimalProps = {
            petName: 'hello world',
            intakeDate: moment().subtract(5, 'days').toDate()
        };

    before(function (done) {
        animalDB = new AnimalDatabase({
            debugLevel: Debuggable.PROD
        });
        done();
    });

    after(function (done) {
        animalDB.stop()
            .then(done)
            .catch(done)
    });

    describe("saveAnimal()", function () {
        var tSavedAnimalProps;

        it('saves an animal', function (done) {
            var tAnimal = new Animal(tSpecies, tAnimalProps);

            animalDB.saveAnimal(tAnimal, {
                isV1Format: false,
                complete: function (err, animalProps) {
                    if (err) throw err;
                    tSavedAnimalProps = animalProps;
                    expect(tSavedAnimalProps).not.to.be(undefined);
                    var tSavedAnimal = new Animal(tSpecies, tSavedAnimalProps);
                    expect(tSavedAnimal.getValue('petName')).to.equal(tAnimalProps.petName);
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
                    expect(tSavedAnimalProps.petId).not.to.be(undefined);
                    done();
                }
            })

        })
    });

    describe("findAnimals()", function () {
        var animals;

        before(function(done){
            var tAnimal = new Animal(tSpecies, tAnimalProps);

            animalDB.saveAnimal(tAnimal, {
                isV1Format: false,
                complete: done
            });
        });

        it("returns previously saved animals", function (done) {
            animalDB.findAnimals(tAnimalProps, {
                isV1Format: false,
                complete: function (err, result) {
                    if (err) throw err;
                    animals = result;
                    expect(animals.length).to.be.greaterThan(0);
                    animals.forEach(function(animalData){
                        expect(animalData.petId).not.to.be(undefined, 'each animal in responseFormat should have a defined petId');
                        expect(animalData.petName).to.equal(tAnimalProps.petName);
                        expect(animalData.intakeDate).to.equal(tAnimalProps.intakeDate.toISOString());
                    });
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
                    expect(result.length === 0).to.be(true);
                    done();
                }
            })
        });
    });

    describe("find, edit, and save task sequence", function(){
        var tSavedAnimalProps;

        before(function(done){
            var tAnimal = new Animal(tSpecies, tAnimalProps);

            animalDB.saveAnimal(tAnimal, {
                isV1Format: false,
                complete: function (err, animalProps) {
                    if (err) throw err;
                    tSavedAnimalProps = animalProps;
                    done();
                }
            });
        });

        it("completes successfully", function (done) {
            animalDB.findAnimals(tAnimalProps, {
                isV1Format: false,
                complete: function (err, animals) {
                    if (err) throw err;
                    expect(animals.length).to.be.greaterThan(0);
                    var aAnimal = new Animal(tSpecies, animals[0]);
                    aAnimal.setValue('sex', 'female');

                    animalDB.saveAnimal(aAnimal, {
                        isV1Format: false,
                        complete: function (err, savedAnimal) {
                            if (err) throw err;
                            expect(savedAnimal.sex).to.match(/female/);
                            done();
                        }
                    })
                }
            });
        });
    });

    describe("removeAnimal()", function () {
        var tSavedAnimalProps;

        before(function(done){
            var tAnimal = new Animal(tSpecies, tAnimalProps);

            animalDB.saveAnimal(tAnimal, {
                isV1Format: false,
                complete: function (err, animalProps) {
                    if (err) throw err;
                    tSavedAnimalProps = animalProps;
                    done();
                }
            });
        });

        describe("tests", function () {

            it("are initialized correctly", function () {
                expect(tSavedAnimalProps).not.to.be(undefined, 'animal was not returned after save');
                expect(tSavedAnimalProps.petId).not.to.be(undefined, 'petId was not set after save');
            })

        });

        it('removes an animal', function (done) {
            var tAnimal = new Animal(tSpecies, tSavedAnimalProps);

            animalDB.removeAnimal(tAnimal, {
                complete: function (err, removeData) {
                    if (err) throw err;
                    expect(removeData.result).to.match(/success/);
                    done();
                }
            })
        })
    });

});
