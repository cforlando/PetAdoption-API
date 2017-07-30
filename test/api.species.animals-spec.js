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
    var devEnvFlag = config.DEVELOPMENT_ENV;

    before(function () {
        config.DEVELOPMENT_ENV = null;
        return tHelper.beforeAPI()
            .then(function (testComponents) {
                request = supertest(testComponents.server);
            })
    });

    after(function () {
        config.DEVELOPMENT_ENV = devEnvFlag;
        return tHelper.afterAPI()
    });

    describe(sprintf("POST /species/%s/animals/save and POST /species/%s/animals/remove", speciesName, speciesName), function () {

        before(function () {
            config.DEVELOPMENT_ENV = true;
        });

        after(function () {
            config.DEVELOPMENT_ENV = devEnvFlag;
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


    describe(sprintf("POST /species/%s/animals/save", speciesName), function () {

        before(function () {
            config.DEVELOPMENT_ENV = undefined;
        });

        after(function () {
            config.DEVELOPMENT_ENV = devEnvFlag;
        });

        it("returns 401 when unauthorized save animal request made", function () {

            return request.post(tHelper.buildEndpoint('species', speciesName, 'animals', 'save'))
                .type('form')
                .set('Accept', 'application/json')
                .send(testPetDataWithIDSansSpecies)
                .expect(401)
        });
    });

    describe(sprintf("POST /species/:speciesName/animals/remove"), function () {
        var request;


        before(function(){
            config.DEVELOPMENT_ENV = undefined;
            return tHelper.beforeAPI()
                .then(function(testComponents){
                    request = supertest(testComponents.server);
                    return Promise.resolve();
                })
        });

        after(function(){
            config.DEVELOPMENT_ENV = devEnvFlag;
            return tHelper.afterAPI()
        });

        speciesDbImages.forEach(function(dbImage){
            var speciesName = dbImage.getSpeciesName();

            it(sprintf("returns error on unauthorized request to delete a %s", speciesName), function () {

                return request.post(tHelper.buildEndpoint('species', speciesName, 'animals', 'remove'))
                    .send({
                        species: speciesName,
                        petId: 'asdfa90sdfdsfajsdl'
                    })
                    .expect(401)
            });
        })

    });

});