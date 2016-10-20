var moment = require('moment'),
    _ = require('lodash'),

    AnimalFactory = require('../../../../core/mongodb/lib/animal-model-factory'),
    Debuggable = require('../../../../core/lib/debuggable/index'),
    MongoDBAdapter = require('../../../../core/mongodb/lib/adapter');

describe("AnimalModelFactory", function () {
    var dbAdapter,
        props = [
            {
                key: 'tField',
                defaultVal: 'aDefVal',
                valType: 'String'
            },
            {
                key: 'tFieldTwo',
                defaultVal: 'aDefValTwo',
                valType: 'String'
            },
            {
                key: 'aDate',
                defaultVal: moment().toDate().toISOString(),
                valType: 'Date'
            },
            {
                key: 'petId',
                valType: 'String'
            }
        ],
        tAnimalProps = {
            tField: 'hello',
            tFieldTwo: 'world',
            aDate: moment().subtract(4, 'days').toISOString()
        },
        tAnimal,
        AnimalModel;

    beforeAll(function (done) {
        dbAdapter = new MongoDBAdapter({
            debugLevel: Debuggable.PROD
        });

        dbAdapter.connect({
            onSuccess: function () {
                tAnimal = new AnimalFactory('test_animal_model_factory', props, {
                    debugTag: 'aAnimal: ',
                    debugLevel: Debuggable.PROD
                });
                AnimalModel = tAnimal.generateMongooseModel(dbAdapter);
                done();
            },
            onFailure: function () {
                throw new Error("Could not connect to DB")
            }
        })
    });

    afterAll(function (done) {
        AnimalModel.remove({}, function () {
            dbAdapter.close(function () {
                done();
            });
        });
    });

    describe('upsert()', function () {

        it("properly saves an animal", function (done) {
            var tAnimal = new AnimalModel(tAnimalProps);
            tAnimal.upsert({tField: 'hello'}, {
                    isV1Format: false
                },
                function (err, result) {
                    if (err) throw err;
                    var responseFormattedResult = result.responseFormat;
                    expect(responseFormattedResult).not.toBeUndefined();
                    expect(responseFormattedResult.petId).not.toBeUndefined('petId is not defined in responseFormat');
                    expect(responseFormattedResult['tField']).toEqual(tAnimalProps['tField']);
                    expect(responseFormattedResult['tFieldTwo']).toEqual(tAnimalProps['tFieldTwo']);
                    expect(responseFormattedResult['aDate']).toEqual(tAnimalProps['aDate']);
                    expect(responseFormattedResult['petId']).not.toBeUndefined('petId was not assigened on upsert');
                    done();
                });
        });

        it("updates an animal if an existing one is found", function (done) {

            var tAnimalProps = {tField: 'sup', tFieldTwo: 'world'},
                tAnimalProps2 = {tField: tAnimalProps.tField, tFieldV2: 'fam'},
                tAnimal = new AnimalModel(tAnimalProps),
                tAnimal2 = new AnimalModel(tAnimalProps2),
                searchProps = {tField: tAnimalProps.tField};

            tAnimal.upsert(searchProps,
                function (err, result) {
                    if (err) throw err;

                    // get size of collection
                    AnimalModel.find({}, function (err, result) {
                        if (err) throw err;
                        var startLength = result.length;

                        // upset second animal with same identifying props
                        tAnimal2.upsert(searchProps,
                            function (err, result) {
                                if (err) throw err;

                                // get size of collection after upsert
                                AnimalModel.find({}, function (err, newResult) {
                                    expect(startLength).toEqual(newResult.length);
                                    done();
                                })
                            })
                    })
                })

        })
    });

    describe('findAnimals()', function () {

        it("returns a matching animal", function (done) {
            var tProps = {tField: 'hello'};
            AnimalModel.findAnimals(tProps, function (err, result) {
                if (err) throw err;
                expect(result.responseFormat.length > 0).toBe(true);
                done();
            })

        });

        it("returns a matching animal using ISO date strings", function (done) {
            var tAnimalSearchProps = {aDate: tAnimalProps.aDate},
                newAnimalProps3 = {aDate: moment().subtract(10, 'days'), tField: 'date animal only'},
                newAnimal3 = new AnimalModel(newAnimalProps3);

            newAnimal3.upsert({tField: newAnimalProps3}, function (err, result) {
                if (err) throw err;

                AnimalModel.findAnimals(tAnimalSearchProps, {
                    isV1Format: false
                }, function (err, result) {
                    if (err) throw err;
                    expect(result.responseFormat.length > 0).toBe(true);
                    _.forEach(result.responseFormat, function (animalProps, propName) {
                        expect(animalProps.aDate).toEqual(tAnimalSearchProps.aDate);
                    });
                    expect(result.responseFormat[0].tField).toEqual(tAnimalProps.tField, 'Should return previously saved tAnimal');
                    done();
                });
            });
        });

        it("response contains a 'responseFormat' field", function (done) {

            var tProps = {tField: 'hello'};
            AnimalModel.findAnimals(tProps, function (err, result) {
                if (err) throw err;
                expect(result.responseFormat[0]).toBeDefined();
                done();
            })
        });

        it("response's 'responseFormat' returns proper values when no flags passed", function (done) {

            var tProps = {tField: 'hello'};
            AnimalModel.findAnimals(tProps, function (err, result) {
                if (err) throw err;
                expect(result.responseFormat[0]['tField'].val).toEqual(tProps['tField']);
                done();
            })
        });

        it("response's 'responseFormat' returns proper values when 'isV1Format' flag is true", function (done) {

            var tProps = {tField: 'hello'};
            AnimalModel.findAnimals(tProps, {isV1Format: true}, function (err, result) {
                if (err) throw err;
                expect(result.responseFormat[0]['tField'].val).toEqual(tProps['tField']);
                done();
            })
        });

        it("response's 'responseFormat' returns proper values when 'isV1Format' flag is false", function (done) {

            var tProps = {tField: 'hello'};
            AnimalModel.findAnimals(tProps, {isV1Format: false}, function (err, result) {
                if (err) throw err;
                expect(result.responseFormat[0]['tField']).toEqual(tProps['tField']);
                done();
            })
        })
    })
});
