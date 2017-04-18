var supertest = require('supertest');
var async = require('async');
var _ = require('lodash');
var chai = require('chai');

var TestHelper = require('./helper');

var tHelper = new TestHelper();
var expect = chai.expect;
var sprintf = tHelper.sprintf;
var buildJasmineRequestCallback = tHelper.buildJasmineRequestCallback;
var isValidID = tHelper.isValidID;
var request;

describe("/save", function () {
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

    before(function () {
        return tHelper.beforeAPI()
            .then(function (testComponents) {
                request = supertest(testComponents.server);
                return Promise.resolve();
            })
    });

    after(function () {
        return tHelper.afterAPI()
    });

    describe.skip(sprintf("POST save/%s/ and POST remove/%s/", speciesName, speciesName), function () {
        console.error("Authentication required");

        it(sprintf("can save and delete a %s", speciesName), function () {

            return request.post(tHelper.buildEndpoint('save', speciesName))
                .type('form')
                .set('Accept', 'application/json')
                .expect('Content-Type', /json/)
                .send(testPetData)
                .expect(function (response) {
                    var petId = response.body.petId.val;
                    if (!isValidID(petId)) throw new Error(sprintf("Save %s produced an invalid id", speciesName, petId));
                    _.forEach(testPetData, function (propVal, propName) {
                        var savedValue = response.body[propName].val;
                        if (propVal != savedValue) throw new Error(sprintf("Pet data was incorrectly saved: %s(saved) != %s", savedValue, propVal))
                    });
                })
                .expect(200, function (response) {
                    expect(response.body.petId).to.exist;

                    return request.post(tHelper.buildEndpoint('remove', speciesName))
                        .set('Accept', 'application/json')
                        .expect('Content-Type', /json/)
                        .send({
                            species: speciesName,
                            petId: response.body.petId.val
                        })
                        .expect(200)
                })
        })
    });


    describe(sprintf("POST save/%s/model", speciesName), function () {

        it("returns 401 when unauthorized save species request made", function () {

            return request.post(tHelper.buildEndpoint('save', speciesName))
                .type('form')
                .set('Accept', 'application/json')
                .send(testPetDataWithIDSansSpecies)
                .expect(401)
        });
    });

    describe(sprintf("POST save/%s", speciesName), function () {

        it("returns 401 when unauthorized save animal request made", function () {

            return request.post(tHelper.buildEndpoint('save', speciesName))
                .type('form')
                .set('Accept', 'application/json')
                .send(testPetDataWithIDSansSpecies)
                .expect(401)
        });
    });

});