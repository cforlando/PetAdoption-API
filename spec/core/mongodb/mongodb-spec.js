var util = require('util'),

    _ = require('lodash'),
    async = require('async'),
    moment = require('moment'),

    Animal = require('../../../core/lib/animal'),
    Species = require('../../../core/lib/species'),
    MongoAPIDatabase = require('../../../core/mongodb'),

    dbImages = require('../../test-db-images');

describe("MongoAPIDatabase", function () {
    var apiDatabase,
        newSpeciesName = 'new_test_species',
        speciesProps = [
            {
                key: 'species',
                valType: 'String',
                defaultVal: 'aDefSpecies'
            },
            {
                key: 'aValue',
                valType: 'String',
                defaultVal: 'aDefValue'
            },
            {
                key: 'bValue',
                valType: 'Number',
                defaultVal: 3
            }
        ],
        tSpecies = new Species('mongodb_test_species', speciesProps),
        testUserData = {
            firstName: 'TestUserFirstName',
            lastName: 'TestUserLastName',
            photo: 'http://placehold.it/400x400',
            defaults: [{
                key: 'aNewProp',
                val: 'aNewProp value'
            }]
        },
        savedTestUserData,
        v2SavedUserData,
        v2TestUserData = _.defaults({
            firstName: 'changedName'
        }, testUserData);

    v2TestUserData.defaults.push({
        key: 'secondProp',
        val: 'theValue'
    });

    beforeAll(function (done) {
        apiDatabase = new MongoAPIDatabase({
            modelNamePrefix: 'test_mongodb_',
            forcePreset: true,
            preset: dbImages,
            onPresetComplete: done,
            debugTag: 'test_mongo_api_database: '
        });
    });

    afterAll(function (done) {
        apiDatabase.stop(done);
    });

    it("initializes with data passed through options.preset", function (done) {
        if (dbImages.length > 0) {
            async.each(dbImages,
                function each(dbImage, onDBImageChecked) {
                    apiDatabase.findAnimals({species: dbImage.getSpeciesName()}, {
                        complete: function (err, animals) {
                            if (err) throw err;
                            expect(animals.length >= dbImage.getAnimals().length).toBe(true, 'number of animals should be at least as large as db image');
                            onDBImageChecked();
                        }
                    });
                }, function complete() {
                    done();
                });
        } else {
            pending("couldn't verify preset option");
        }
    });

    describe("saveSpecies()", function () {
        it("adds a species", function (done) {
            var initialSpeciesList;
            apiDatabase.getSpeciesList({
                complete: function (err, speciesList) {
                    // if (err) throw err;
                    initialSpeciesList = speciesList;

                    apiDatabase.saveSpecies(newSpeciesName, speciesProps, {
                        complete: function (err, newSpeciesData) {
                            if (err) throw err;
                            expect(newSpeciesData).not.toBeUndefined();
                            _.forEach(speciesProps, function (propData) {
                                expect(_.find(newSpeciesData.props, {key: propData.key})).toEqual(propData);
                            });
                            apiDatabase.getSpeciesList({
                                complete: function (err, speciesList) {
                                    if (err) throw err;
                                    expect(_.includes(speciesList, newSpeciesName)).toBe(true, 'new species should be found in speciesList');
                                    done();
                                }
                            })
                        }
                    });
                }
            });
        });
    });

    describe("saveAnimal()", function () {
        beforeAll(function (done) {
            apiDatabase.saveSpecies(newSpeciesName, speciesProps, {
                complete: function (err, species) {
                    if (err) throw err;
                    done();
                }
            });
        });

        it("can save an animal to a newly created species", function (done) {
            apiDatabase.saveAnimal(newSpeciesName, {
                species: newSpeciesName,
                aValue: 'success'
            }, {
                complete: function (err, result) {
                    if (err) throw err;
                    apiDatabase.findAnimals({species: newSpeciesName}, {
                        isV1Format: false,
                        complete: function (err, animals) {
                            if (err) throw err;
                            expect(animals.length > 0).toBe(true, 'there should be at least one saved  animal');
                            _.forEach(animals, function (animalProps) {
                                expect(animalProps.species).toEqual(newSpeciesName);
                            });
                            done();
                        }
                    })
                }
            });
        });
    });

    describe("saveSpecies()", function () {
        beforeAll(function (done) {
            apiDatabase.saveSpecies(newSpeciesName, speciesProps, {
                complete: function (err, species) {
                    if (err) throw err;
                    done();
                }
            });
        });

        it("removes obsolete props after a species has been altered", function (done) {
            var newPresetSpeciesProps = [
                    {
                        key: 'species',
                        valType: 'String',
                        defaultVal: 'aDefSpecies'
                    }, {
                        key: 'aNewProp',
                        defaultVal: 'aNewPropVal',
                        valType: "String"
                    },
                    {
                        key: 'aNewDateProp',
                        defaultVal: moment().subtract(5, 'days').toDate().toISOString(),
                        valType: 'Date'
                    }
                ],
                newSpeciesTestAnimalProps = {
                    species: newSpeciesName,
                    aNewDateProp: moment().subtract(3, 'days').toDate().toISOString()
                };

            apiDatabase.saveSpecies(newSpeciesName, newPresetSpeciesProps, {
                complete: function (err, savedSpeciesData) {
                    if (err) throw err;
                    expect(savedSpeciesData).not.toBeUndefined();
                    _.forEach(newPresetSpeciesProps, function (preSavedNewSpeciesProp) {
                        expect(_.find(savedSpeciesData.props, {key: preSavedNewSpeciesProp.key})).toEqual(preSavedNewSpeciesProp)
                    });
                    var newPropKeys = savedSpeciesData.props.map(function (propData) {
                        return propData.key
                    });
                    apiDatabase.saveAnimal(newSpeciesName, newSpeciesTestAnimalProps, {
                        isV1Format: false,
                        complete: function (err, animal) {
                            if (err) throw err;
                            _.forEach(animal, function (animalPropVal, animalPropName) {
                                expect(_.includes(newPropKeys, animalPropName)).toBe(true, util.format('new animal props (%j) shouldn\'t contain %s', newPropKeys, animalPropName));
                            });
                            _.forEach(newSpeciesTestAnimalProps, function (newSpeciesTestAnimalProp, newSpeciesTestAnimalPropName) {
                                expect(animal[newSpeciesTestAnimalPropName]).toEqual(newSpeciesTestAnimalProp, 'the returned values should match the new original values');
                            });
                            done();
                        }
                    })
                }
            })
        });

    });


    describe("deleteSpecies()", function () {

        beforeAll(function (done) {
            apiDatabase.saveSpecies(newSpeciesName, speciesProps, {
                complete: function (err, species) {
                    if (err) throw err;
                    done();
                }
            });
        });

        it("removes a pre-existing species", function (done) {
            apiDatabase.getSpeciesList({
                complete: function (err, speciesList) {
                    if (err) throw err;
                    var initialList = speciesList;
                    expect(_.includes(speciesList, newSpeciesName)).toBe(true, "initial species list should contain to be removed species");
                    apiDatabase.deleteSpecies(newSpeciesName, {
                        complete: function (err, result) {
                            if (err) throw err;
                            expect(result).toBe(true, "the callback is provided with a boolean response");
                            apiDatabase.getSpeciesList({
                                complete: function (err, newSpeciesList) {
                                    if (err) throw err;
                                    expect(_.includes(newSpeciesList, newSpeciesName)).toBe(false, "species list should not contain removed species");
                                    expect(newSpeciesList.length).toEqual(initialList.length - 1, "new species list should contain one less entry than the initial species list");
                                    done();
                                }
                            });
                        }
                    });
                }
            })
        });
    });


    describe("saveUser()", function () {

        it("can save a user", function (done) {
            apiDatabase.saveUser(testUserData, {
                complete: function (err, userData) {
                    if (err) throw err;
                    savedTestUserData = userData;
                    expect(savedTestUserData).not.toBeUndefined();
                    expect(savedTestUserData.id).not.toBeUndefined();
                    _.forEach(testUserData.defaults, function (defaultProp, index) {
                        expect(savedTestUserData.defaults[index].key).toEqual(defaultProp.key);
                        expect(savedTestUserData.defaults[index].val).toEqual(defaultProp.val);
                    });
                    done();
                }
            })
        });

        it("can update a user", function (done) {
            expect(v2TestUserData.defaults.length).toEqual(2, 'there should be 2 default values');
            apiDatabase.saveUser(v2TestUserData, {
                complete: function (err, userData) {
                    if (err) throw err;
                    v2SavedUserData = userData;
                    expect(v2SavedUserData).not.toBeUndefined();
                    expect(v2SavedUserData.id).toEqual(savedTestUserData.id);
                    expect(v2SavedUserData.firstName).toEqual(v2TestUserData.firstName);
                    expect(v2SavedUserData.defaults.length).toEqual(2, 'there should be 2 default values');
                    _.forEach(v2TestUserData.defaults, function (defaultProp, index) {
                        expect(v2TestUserData.defaults[index].key).toEqual(defaultProp.key);
                        expect(v2TestUserData.defaults[index].val).toEqual(defaultProp.val);
                    });
                    done();
                }
            })
        });

    });

    describe("findUser()", function () {
        beforeAll(function (done) {
            if (!v2SavedUserData) {
                apiDatabase.saveUser(v2TestUserData, {
                    complete: function (err, userData) {
                        if (err) throw err;
                        v2SavedUserData = userData;
                        done();
                    }
                })
            } else {
                done();
            }
        });

        it("can retrieve a user", function (done) {
            apiDatabase.findUser({id: v2SavedUserData.id}, {
                complete: function (err, userData) {
                    if (err) throw err;
                    expect(userData).not.toBeUndefined();
                    expect(userData.id).toEqual(v2SavedUserData.id);
                    expect(userData.firstName).toEqual(v2SavedUserData.firstName);
                    expect(userData.defaults.length).toEqual(2, 'there should be 2 default values');
                    _.forEach(v2TestUserData.defaults, function (defaultProp, index) {
                        expect(userData.defaults[index].key).toEqual(defaultProp.key);
                        expect(userData.defaults[index].val).toEqual(defaultProp.val);
                    });
                    done();
                }
            })
        })
    });
});
