var request = require('supertest'),
    expect = require('expect.js'),

    TestHelper = require('./helper'),

    tHelper = new TestHelper(),
    speciesDBImages = tHelper.getTestDBImages(),
    sprintf = tHelper.sprintf,
    buildEndpoint = tHelper.buildEndpoint,
    buildJasmineRequestCallback = tHelper.buildJasmineRequestCallback,
    server;

describe(sprintf("/remove"), function () {
    console.error("Authentication required");

    before(function(done){
        tHelper.beforeAPI()
            .then(function(testComponents){
                server = testComponents.server;
            })
            .then(done)
            .catch(done)
    });

    after(function(done){
        tHelper.afterAPI()
            .then(done)
            .catch(done)
    });

    speciesDBImages.forEach(function(dbImage){
        var speciesName = dbImage.getSpeciesName();

        it(sprintf("returns error on invalid request to delete a %s", speciesName), function (done) {
            request(server)
                .post(buildEndpoint('remove', speciesName))
                .send({
                    species: speciesName,
                    petId: 'asdfa90sdfdsfajsdl'
                })
                .expect(401, buildJasmineRequestCallback(done))
        });
    })

});
