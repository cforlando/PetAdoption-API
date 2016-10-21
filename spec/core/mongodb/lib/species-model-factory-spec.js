var _ = require('lodash'),

    SpeciesFactory = require('../../../../core/mongodb/lib/species-model-factory'),
    Debuggable = require('../../../../core/lib/debuggable'),
    MongoDBAdapter = require('../../../../core/mongodb/lib/adapter');

describe("SpeciesModelFactory", function () {
    var dbAdapter,
        speciesProps = [
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
        testSpeciesName = 'test_species_species_name',
        aSpecies,
        tSpecies,
        tSpeciesModel;

    beforeAll(function (done) {
        dbAdapter = new MongoDBAdapter({
            debugLevel: Debuggable.PROD
        });
        dbAdapter.connect({
            onSuccess: function () {
                tSpecies = new SpeciesFactory('test_species', {
                    debugLevel: Debuggable.PROD,
                    debugTag: 'sSpecies: '
                });
                tSpeciesModel = tSpecies.generateMongooseModel(dbAdapter);
                done();
            },
            onFailure: function () {
                throw new Error("Could not connect to DB")
            }
        })
    });

    afterAll(function (done) {
        dbAdapter.close(done);
    });

    describe("Model", function () {

        describe("save()", function () {

            it("saves a species", function (done) {
                var tSpecies = new tSpeciesModel({
                    name: testSpeciesName,
                    json: JSON.stringify(speciesProps)
                });
                tSpecies.save(function (err, savedSpecies) {
                    if (err) throw err;
                    aSpecies = savedSpecies.toObject();
                    expect(aSpecies).not.toBeUndefined('No species was returned on save');
                    _.forEach(speciesProps, function(speciesPropData){
                        var savedSpeciesPropData = _.find(aSpecies.responseFormat, {key: speciesPropData.key});
                        expect(savedSpeciesPropData).toEqual(speciesPropData)
                    });
                    expect(aSpecies.responseFormat).not.toBeUndefined("responseFormat not set");
                    done();
                });
            })
        });

        describe("getLatest()", function () {
            it("returns a previously saved species", function (done) {
                tSpeciesModel.getLatest(function (err, foundSpecies) {
                    if (err) throw err;
                    expect(foundSpecies).not.toBeUndefined('No species was returned on save');
                    _.forEach(speciesProps, function(speciesPropData){
                        var foundSpeciesPropData = _.find(foundSpecies.responseFormat, {key: speciesPropData.key});
                        expect(foundSpeciesPropData).toEqual(speciesPropData)
                    });
                    done()
                });
            })
        });
    });

});
