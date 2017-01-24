var request = require('supertest'),
    async = require('async'),
    _ = require('lodash'),
    expect = require('expect.js'),

    TestHelper = require('./helper'),

    tHelper = new TestHelper(),
    sprintf = tHelper.sprintf,
    buildEndpoint = tHelper.buildEndpoint,
    buildJasmineRequestCallback = tHelper.buildJasmineRequestCallback,
    isValidID = tHelper.isValidID;

describe("/save", function () {
    var speciesDBImages = tHelper.getTestDBImages(),
        dbImage = speciesDBImages[0],
        speciesName = dbImage.getSpeciesName(),
        testPetDataWithIDSansSpecies = {
            petName: 'erred pet',
            age: '10 years',
            petId: 'daskljfasdkljfasdasdf'
        },
        testPetData = {
            petName: 'success pet',
            species: speciesName,
            age: '10 years'
        },
        server;

    before(function (done) {
        tHelper.beforeAPI()
            .then(function (testComponents) {
                server = testComponents.server;
            })
            .then(done)
            .catch(done)
    });

    after(function (done) {
        tHelper.afterAPI()
            .then(done)
            .catch(done)
    });

    describe.skip(sprintf("POST save/%s/ and POST remove/%s/", speciesName, speciesName), function () {
        console.error("Authentication required");

        it(sprintf("can save and delete a %s", speciesName), function (done) {
            request(server)
                .post(buildEndpoint('save', speciesName))
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
                    if (!response.body.petId) throw new Error(sprintf("%s was not saved", speciesName));
                    request(server)
                        .post(buildEndpoint('remove', speciesName))
                        .set('Accept', 'application/json')
                        .expect('Content-Type', /json/)
                        .send({
                            species: speciesName,
                            petId: response.body.petId.val
                        })
                        .expect(200, buildJasmineRequestCallback(done))
                })
        })
    });


    describe(sprintf("POST save/%s/model", speciesName), function () {

        it("returns 401 when unauthorized save species request made", function (done) {

            request(server)
                .post(buildEndpoint('save', speciesName))
                .type('form')
                .set('Accept', 'application/json')
                .send(testPetDataWithIDSansSpecies)
                .expect(401, buildJasmineRequestCallback(done))
        });
    });

    describe(sprintf("POST save/%s", speciesName), function () {

        it("returns 401 when unauthorized save animal request made", function (done) {

            request(server)
                .post(buildEndpoint('save', speciesName))
                .type('form')
                .set('Accept', 'application/json')
                .send(testPetDataWithIDSansSpecies)
                .expect(401, buildJasmineRequestCallback(done))
        });
    });

});