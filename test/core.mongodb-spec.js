var util = require('util'),

    _ = require('lodash'),
    async = require('async'),
    moment = require('moment'),
    expect = require('expect.js'),

    MongoAPIDatabase = require('../core/mongodb'),

    TestHelper = require('./helper')._global,

    dbImages = TestHelper.getTestDBImages();

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

    before(function (done) {
        apiDatabase = new MongoAPIDatabase({
            collectionNamePrefix: 'test_mongodb_',
            preset: [],
            debugTag: 'test_mongo_api_database: '
        });

        apiDatabase.uploadDBImages(dbImages)
            .then(function(){
                // wrap function to ignore arguments
                done();
            })
            .catch(done)
    });

    after(function (done) {
        apiDatabase.stop()
            .then(done)
    });

    it("initializes with data passed through options.preset", function (done) {
        if (dbImages.length) {
            async.each(dbImages,
                function each(dbImage, onDBImageChecked) {
                    apiDatabase.findAnimals({species: dbImage.getSpeciesName()}, {
                        complete: function (err, animals) {
                            if (err) throw err;
                            expect(animals.length >= dbImage.getAnimals().length).to.be(true, 'number of animals should be at least as large as db image');
                            onDBImageChecked();
                        }
                    });
                }, function complete() {
                    done();
                });
        } else {
            throw new Error("No test dbImages specified to test against");
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
                            expect(newSpeciesData).not.to.be(undefined);
                            _.forEach(speciesProps, function (propData) {
                                expect(_.find(newSpeciesData.props, {key: propData.key})).to.equal(propData);
                            });
                            apiDatabase.getSpeciesList({
                                complete: function (err, speciesList) {
                                    if (err) throw err;
                                    expect(_.includes(speciesList, newSpeciesName)).to.be(true, 'new species should be found in speciesList');
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
        before(function (done) {
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
                            expect(animals.length > 0).to.be(true, 'there should be at least one saved  animal');
                            _.forEach(animals, function (animalProps) {
                                expect(animalProps.species).to.equal(newSpeciesName);
                            });
                            done();
                        }
                    })
                }
            });
        });
    });

    describe("saveSpecies()", function () {
        before(function (done) {
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
                    expect(savedSpeciesData).not.to.be(undefined);
                    _.forEach(newPresetSpeciesProps, function (preSavedNewSpeciesProp) {
                        expect(_.find(savedSpeciesData.props, {key: preSavedNewSpeciesProp.key})).to.equal(preSavedNewSpeciesProp)
                    });
                    var newPropKeys = savedSpeciesData.props.map(function (propData) {
                        return propData.key
                    });
                    apiDatabase.saveAnimal(newSpeciesName, newSpeciesTestAnimalProps, {
                        isV1Format: false,
                        complete: function (err, animal) {
                            if (err) throw err;
                            _.forEach(animal, function (animalPropVal, animalPropName) {
                                expect(_.includes(newPropKeys, animalPropName)).to.be(true, util.format('new animal props (%j) shouldn\'t contain %s', newPropKeys, animalPropName));
                            });
                            _.forEach(newSpeciesTestAnimalProps, function (newSpeciesTestAnimalProp, newSpeciesTestAnimalPropName) {
                                expect(animal[newSpeciesTestAnimalPropName]).to.equal(newSpeciesTestAnimalProp, 'the returned values should match the new original values');
                            });
                            done();
                        }
                    })
                }
            })
        });

    });


    describe("deleteSpecies()", function () {

        before(function (done) {
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
                    expect(_.includes(speciesList, newSpeciesName)).to.be(true, "initial species list should contain to be removed species");
                    apiDatabase.deleteSpecies(newSpeciesName, {
                        complete: function (err, result) {
                            if (err) throw err;
                            expect(result).to.be(true, "the callback is provided with a boolean response");
                            apiDatabase.getSpeciesList({
                                complete: function (err, newSpeciesList) {
                                    if (err) throw err;
                                    expect(_.includes(newSpeciesList, newSpeciesName)).to.be(false, "species list should not contain removed species");
                                    expect(newSpeciesList.length).to.equal(initialList.length - 1, "new species list should contain one less entry than the initial species list");
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
                    expect(savedTestUserData).not.to.be(undefined);
                    expect(savedTestUserData.id).not.to.be(undefined);
                    _.forEach(testUserData.defaults, function (defaultProp, index) {
                        expect(savedTestUserData.defaults[index].key).to.equal(defaultProp.key);
                        expect(savedTestUserData.defaults[index].val).to.equal(defaultProp.val);
                    });
                    done();
                }
            })
        });

        it("can update a user", function (done) {
            expect(v2TestUserData.defaults.length).to.equal(2, 'there should be 2 default values');
            apiDatabase.saveUser(v2TestUserData, {
                complete: function (err, userData) {
                    if (err) throw err;
                    v2SavedUserData = userData;
                    expect(v2SavedUserData).not.to.be(undefined);
                    expect(v2SavedUserData.id).to.equal(savedTestUserData.id);
                    expect(v2SavedUserData.firstName).to.equal(v2TestUserData.firstName);
                    expect(v2SavedUserData.defaults.length).to.equal(2, 'there should be 2 default values');
                    _.forEach(v2TestUserData.defaults, function (defaultProp, index) {
                        expect(v2TestUserData.defaults[index].key).to.equal(defaultProp.key);
                        expect(v2TestUserData.defaults[index].val).to.equal(defaultProp.val);
                    });
                    done();
                }
            })
        });

    });

    describe("findUser()", function () {
        before(function (done) {
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
                    expect(userData).not.to.be(undefined);
                    expect(userData.id).to.equal(v2SavedUserData.id);
                    expect(userData.firstName).to.equal(v2SavedUserData.firstName);
                    expect(userData.defaults.length).to.equal(2, 'there should be 2 default values');
                    _.forEach(v2TestUserData.defaults, function (defaultProp, index) {
                        expect(userData.defaults[index].key).to.equal(defaultProp.key);
                        expect(userData.defaults[index].val).to.equal(defaultProp.val);
                    });
                    done();
                }
            })
        })
    });
});
