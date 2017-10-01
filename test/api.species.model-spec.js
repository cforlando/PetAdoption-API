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

describe("/species/:speciesName/model", function () {
    var speciesDbImages = tHelper.getTestDbImages();
    var dbImage = speciesDbImages[0];
    var speciesName = dbImage.getSpeciesName();
    var procesEnvDevFlag = config.DEVELOPMENT_ENV;
    var testSpeciesProps = [
        {
            key: 'testProp',
            defaultVal: 'someVal',
            options: ['one', 'two', 'three'],
            description: 'a test property',
            label: 'whoops',
            valType: 'string'
        }
    ];

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

    describe(sprintf("POST /species/%s/model/save", speciesName), function () {

        describe('when DEVELOPMENT_ENV flag not set', function(){
            before(function () {
                config.DEVELOPMENT_ENV = undefined;
            });

            after(function () {
                config.DEVELOPMENT_ENV = procesEnvDevFlag;
            });

            it("returns 401 when unauthorized update species request made", function () {

                return request.post(tHelper.buildEndpoint('species', speciesName, 'model', 'create'))
                    .type('form')
                    .set('Accept', 'application/json')
                    .send(testSpeciesProps)
                    .expect(401)
            });

            it("returns 401 when unauthorized create species request made", function () {

                return request.post(tHelper.buildEndpoint('species', speciesName, 'model', 'update'))
                    .type('form')
                    .set('Accept', 'application/json')
                    .send(testSpeciesProps)
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

            it("successfully creates and deletes a species model", function () {
                var testSpeciesName = 'temporarySpecies-' + Date.now();

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
});