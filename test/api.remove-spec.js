var supertest = require('supertest');
var chai = require('chai');

var TestHelper = require('./helper');
var expect = chai.expect;

var tHelper = new TestHelper();
var speciesDbImages = tHelper.getTestDbImages();
var sprintf = tHelper.sprintf;

describe(sprintf("/remove"), function () {
    var request;


    before(function(){
        console.error("Authentication required");
        return tHelper.beforeAPI()
            .then(function(testComponents){
                request = supertest(testComponents.server);
                return Promise.resolve();
            })
    });

    after(function(){
        return tHelper.afterAPI()
    });

    speciesDbImages.forEach(function(dbImage){
        var speciesName = dbImage.getSpeciesName();

        it(sprintf("returns error on invalid request to delete a %s", speciesName), function () {
            request.post(tHelper.buildEndpoint('remove', speciesName))
                .send({
                    species: speciesName,
                    petId: 'asdfa90sdfdsfajsdl'
                })
                .expect(401)
        });
    })

});
