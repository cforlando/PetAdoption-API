var supertest = require('supertest');
var async = require('async');
var _ = require('lodash');
var chai = require('chai');

var config = require('../core/config');
var Species = require('../core/lib/species');
var TestHelper = require('./helper');

var tHelper = new TestHelper();
var expect = chai.expect;
var sprintf = tHelper.sprintf;
var isValidID = tHelper.isValidID;
var request;

describe("/species/:speciesName/animals/save", function () {
    var speciesDbImages = tHelper.getTestDbImages();
    var dbImage = speciesDbImages[0];
    var speciesName = dbImage.getSpeciesName();
    var testPetDataWithIDSansSpecies = {
        petName: 'erred pet',
        age: '10 years',
        petId: 'daskljfasdkljfasdasdf'
    };
    var testPetData = {
        petName: 'success pet',
        species: speciesName,
        age: '10 years'
    };
    var procesEnvDevFlag = config.DEVELOPMENT_ENV;

    before(function () {
        config.DEVELOPMENT_ENV = null;
        return tHelper.beforeAPI()
            .then(function (testComponents) {
                request = supertest(testComponents.server);
            })
    });

    after(function () {
        config.DEVELOPMENT_ENV = procesEnvDevFlag;
        return tHelper.afterAPI()
    });

    describe(sprintf("POST /species/%s/animals/save and POST /species/%s/animals/remove", speciesName, speciesName), function () {

        before(function () {
            config.DEVELOPMENT_ENV = true;
        });

        after(function () {
            config.DEVELOPMENT_ENV = procesEnvDevFlag;
        });

        it(sprintf("can save and delete a %s", speciesName), function () {
            var petId;
            var endpoint = tHelper.buildEndpoint('species', speciesName, 'animals', 'save');

            return request.post(endpoint)
                .type('form')
                .set('Accept', 'application/json')
                .send(testPetData)
                .expect('Content-Type', /json/)
                .expect(200)
                .then(function (response) {

                    expect(response.body.petId).to.exist;

                    petId = response.body.petId.val;

                    if (!isValidID(petId)) {
                        throw new Error(sprintf("Save '%s' produced an invalid id: %s", speciesName, petId));
                    }

                    _.forEach(testPetData, function (propVal, propName) {
                        var savedValue = response.body[propName] && response.body[propName].val;
                        if (propVal !== savedValue) {
                            throw new Error(sprintf("Pet data was incorrectly saved: %s(saved) != '%s'", savedValue, propVal));
                        }
                    });
                })
                .then(function () {
                    return request.post(tHelper.buildEndpoint('species', speciesName, 'animals', 'remove'))
                        .set('Accept', 'application/json')
                        .send({
                            species: speciesName,
                            petId: petId
                        })
                        .expect('Content-Type', /json/)
                        .expect(200)
                })
        })
    });


    describe(sprintf("POST /species/%s/model/save", speciesName), function () {

        describe('when DEVELOPMENT_ENV flag not set', function(){
            before(function () {
                config.DEVELOPMENT_ENV = undefined;
            });

            after(function () {
                config.DEVELOPMENT_ENV = procesEnvDevFlag;
            });

            it("returns 401 when unauthorized save species request made", function () {

                return request.post(tHelper.buildEndpoint('species', speciesName, 'model', 'update'))
                    .type('form')
                    .set('Accept', 'application/json')
                    .send(testPetDataWithIDSansSpecies)
                    .expect(401)
            });
        });

        describe('when DEVELOPMENT_ENV is set', function(){
            before(function () {
                config.DEVELOPMENT_ENV = true;
            });

            after(function () {
                config.DEVELOPMENT_ENV = procesEnvDevFlag;
            });

            it("successfully saves and deletes a species model", function () {
                var testSpeciesName = 'temporarySpecies-' + Date.now();
                var testSpeciesProps = [
                    {
                        key: 'testProp',
                        defaultVal: 'someVal',
                        options: ['one', 'two', 'three'],
                        description: 'a test property',
                        label: 'whoops',
                        valType: 'String'
                    }
                ];

                return request.post(tHelper.buildEndpoint('species', testSpeciesName, 'model', 'create'))
                    .type('form')
                    .set('Accept', 'application/json')
                    .send(testSpeciesProps)
                    .expect(200)
                    .then(function (response) {
                        testSpeciesProps.forEach(function(propData){
                            expect(testSpeciesProps).to.include(propData);
                        });

                        return request.post(tHelper.buildEndpoint('species', testSpeciesName, 'model', 'remove'))
                            .set('Accept', 'application/json')
                            .expect(200)
                    })
            });
        })
    });

    describe(sprintf("POST /species/%s/animals/save", speciesName), function () {

        before(function () {
            config.DEVELOPMENT_ENV = undefined;
        });

        after(function () {
            config.DEVELOPMENT_ENV = procesEnvDevFlag;
        });

        it("returns 401 when unauthorized save animal request made", function () {

            return request.post(tHelper.buildEndpoint('species', speciesName, 'animals', 'save'))
                .type('form')
                .set('Accept', 'application/json')
                .send(testPetDataWithIDSansSpecies)
                .expect(401)
        });
    });

});