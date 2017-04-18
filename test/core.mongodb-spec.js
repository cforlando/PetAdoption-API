var util = require('util');

var _ = require('lodash');
var async = require('async');
var moment = require('moment');
var chai = require('chai');

var MongoAPIDatabase = require('../core/mongodb');
var TestHelper = require('./helper')._global;

var expect = chai.expect;
var dbImages = TestHelper.getTestDbImages();

describe("MongoAPIDatabase", function () {
    var testApiDatabase;
    var newSpeciesName = 'new_test_species';
    var speciesProps = [
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
    ];
    var testUserData = {
        id: 'test-user-id',
        firstName: 'TestUserFirstName',
        lastName: 'TestUserLastName',
        photo: 'http://placehold.it/400x400',
        defaults: [{
            key: 'aNewProp',
            val: 'aNewProp value'
        }]
    };
    var updateTestUserData = _.defaults({
        firstName: 'changedName'
    }, testUserData);
    var savedUpdateTestUserData;
    var savedTestUserData;

    updateTestUserData.defaults.push({
        key: 'secondProp',
        val: 'theValue'
    });

    before(function () {
        var dbOptions = {
            collectionNamePrefix: 'test_mongodb_',
            preset: [],
            debugTag: 'test_mongo_api_database: '
        };

        testApiDatabase = new MongoAPIDatabase(dbOptions);

        return testApiDatabase.uploadDbImages(dbImages)
    });

    after(function () {
        return testApiDatabase.stop()
    });

    it("initializes with data passed through options.preset", function () {
        if (!dbImages.length) {
            return Promise.reject(new Error("No test dbImages specified to test against"));
        }

        return Promise.all(dbImages.map(function (dbImage, onDbImageChecked) {
            return testApiDatabase.findAnimals({species: dbImage.getSpeciesName()})
                .then(function (animals) {

                    expect(animals).to.have.length.of.at.least(dbImage.getAnimals().length);

                    return Promise.resolve();
                });
        }));
    });

    describe("saveSpecies()", function () {

        it("adds a species", function () {
            var initialSpeciesList;

            return testApiDatabase.getSpeciesList()
                .then(function (speciesList) {
                    initialSpeciesList = speciesList;

                    return testApiDatabase.saveSpecies(newSpeciesName, speciesProps)
                })
                .then(function (newSpeciesData) {
                    expect(newSpeciesData).to.exist;

                    _.forEach(speciesProps, function (propData) {
                        var newSpeciesProp = _.find(newSpeciesData.props, {key: propData.key});

                        expect(newSpeciesProp).to.include.all.keys(Object.keys(propData));

                        _.forEach(propData, function(propMetaVal, propMetaName){
                            expect(newSpeciesProp[propMetaName]).to.eql(propMetaVal);
                        })
                    });

                    return testApiDatabase.getSpeciesList()
                })
                .then(function (speciesList) {

                    expect(speciesList).to.include(newSpeciesName, 'new species should be found in speciesList');
                    expect(speciesList).to.have.lengthOf(initialSpeciesList.length + 1);

                    return Promise.resolve();
                })
        })
    });

    describe("saveAnimal()", function () {

        before(function () {
            return testApiDatabase.saveSpecies(newSpeciesName, speciesProps);
        });

        it("can save an animal to a newly created species", function () {
            var animalProps = {
                species: newSpeciesName,
                aValue: 'success'
            };
            var initialSpeciesAnimalCount;

            return testApiDatabase.findAnimals({species: newSpeciesName}, {isV1Format: false})
                .then(function(animals){

                    initialSpeciesAnimalCount = animals.length;

                    return testApiDatabase.saveAnimal(newSpeciesName, animalProps)
                })
                .then(function (result) {
                    return testApiDatabase.findAnimals({species: newSpeciesName}, {isV1Format: false})
                })
                .then(function (animals) {
                    expect(animals).to.have.lengthOf(initialSpeciesAnimalCount + 1);

                    _.forEach(animals, function (animalProps) {
                        expect(animalProps.species).to.eql(newSpeciesName);
                    });

                    return Promise.resolve();
                })
        });
    });

    describe("saveSpecies()", function () {

        before(function () {
            return testApiDatabase.saveSpecies(newSpeciesName, speciesProps);
        });

        it("removes obsolete props after a species has been altered", function () {
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
            ];
            var newSpeciesTestAnimalProps = {
                species: newSpeciesName,
                aNewDateProp: moment().subtract(3, 'days').toDate().toISOString()
            };
            var newPropKeys;

            return testApiDatabase.saveSpecies(newSpeciesName, newPresetSpeciesProps)
                .then(function (savedSpeciesData) {
                    expect(savedSpeciesData).to.exist;

                    _.forEach(newPresetSpeciesProps, function (preSavedNewSpeciesProp) {
                        var savedSpeciesProp = _.find(savedSpeciesData.props, {key: preSavedNewSpeciesProp.key});
                        expect(savedSpeciesProp).to.include.all.keys(Object.keys(preSavedNewSpeciesProp));
                        _.forEach(preSavedNewSpeciesProp, function(propMetaVal, propMetaName){
                            expect(savedSpeciesProp[propMetaName]).to.eql(propMetaVal);
                        })
                    });

                    newPropKeys = savedSpeciesData.props.map(function (propData) {
                        return propData.key
                    });

                    return testApiDatabase.saveAnimal(newSpeciesName, newSpeciesTestAnimalProps, {isV1Format: false})
                })
                .then(function (animal) {
                    _.forEach(animal, function (animalPropVal, animalPropName) {
                        expect(newPropKeys).to.include(animalPropName);
                    });

                    _.forEach(newSpeciesTestAnimalProps, function (newSpeciesTestAnimalProp, newSpeciesTestAnimalPropName) {
                        expect(animal[newSpeciesTestAnimalPropName]).to.eql(newSpeciesTestAnimalProp, 'the returned values should match the new original values');
                    });

                    return Promise.resolve();
                })
        })
    });


    describe("deleteSpecies()", function () {

        before(function () {
            return testApiDatabase.saveSpecies(newSpeciesName, speciesProps);
        });

        it("removes a pre-existing species", function () {
            var initialList;

            return testApiDatabase.getSpeciesList()
                .then(function (speciesList) {
                    initialList = speciesList;

                    expect(speciesList).to.include(newSpeciesName);

                    return testApiDatabase.deleteSpecies(newSpeciesName);
                })
                .then(function (deletionResult) {

                    expect(deletionResult).to.exist;

                    return testApiDatabase.getSpeciesList();
                })
                .then(function (newSpeciesList) {

                    expect(newSpeciesList).not.to.include(newSpeciesName, "species list should not contain removed species");
                    expect(newSpeciesList).to.have.lengthOf(initialList.length - 1, "new species list should contain one less entry than the initial species list");

                    return Promise.resolve();
                })
        });
    });


    describe("saveUser()", function () {

        before(function () {
            expect(updateTestUserData.defaults.length).to.eql(2, 'there should be 2 default values for testing');
        });

        it("can save and update a user", function () {

            return testApiDatabase.saveUser(testUserData)
                .then(function (userData) {
                    // keep a reference for later reuse
                    savedTestUserData = userData;

                    expect(userData).to.exist;
                    expect(userData.id).to.exist;
                    _.forEach(testUserData.defaults, function (defaultProp, index) {
                        expect(userData.defaults[index].key).to.eql(defaultProp.key);
                        expect(userData.defaults[index].val).to.eql(defaultProp.val);
                    });

                    return Promise.resolve();
                })
        });

        it("can update a user", function () {
            // ensure test is set up correctly
            expect(savedTestUserData.id).to.exist;

            return testApiDatabase.saveUser(updateTestUserData)
                .then(function (userData) {
                    // keep a reference for later reuse
                    savedUpdateTestUserData = userData;

                    expect(userData).to.exist;
                    expect(userData.id).to.eql(savedTestUserData.id);
                    expect(userData.firstName).to.eql(updateTestUserData.firstName);
                    expect(userData.defaults.length).to.eql(updateTestUserData.defaults.length);
                    _.forEach(updateTestUserData.defaults, function (defaultProp, index) {
                        expect(updateTestUserData.defaults[index].key).to.eql(defaultProp.key);
                        expect(updateTestUserData.defaults[index].val).to.eql(defaultProp.val);
                    });

                    return Promise.resolve();
                })
        })
    });

    describe("findUser()", function () {

        before(function () {
            // reuse previously saved user data for testing if possible
            if (!savedUpdateTestUserData) {
                return testApiDatabase.saveUser(updateTestUserData)
                    .then(function (userData) {
                        savedUpdateTestUserData = userData;
                        return Promise.resolve();
                    })
            }
        });

        it("can retrieve a user", function () {

            return testApiDatabase.findUser({id: savedUpdateTestUserData.id})
                .then(function (userData) {

                    expect(userData).to.exist;
                    expect(userData.id).to.eql(savedUpdateTestUserData.id);
                    expect(userData.firstName).to.eql(savedUpdateTestUserData.firstName);
                    expect(userData.defaults).to.have.lengthOf(updateTestUserData.defaults.length);
                    _.forEach(updateTestUserData.defaults, function (defaultProp, index) {
                        expect(userData.defaults[index].key).to.eql(defaultProp.key);
                        expect(userData.defaults[index].val).to.eql(defaultProp.val);
                    });

                    return Promise.resolve();
                })
        })
    })
});
