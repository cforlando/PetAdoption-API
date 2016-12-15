var _ = require('lodash'),

    Species = require('../../../core/lib/species'),
    testData = require('../../test-db-images'),
    testSpeciesImage = testData[0],
    testSpecies = new Species(testSpeciesImage.getSpeciesName(), testSpeciesImage.getSpeciesProps());

describe("Animal", function () {
    var Animal = require('../../../core/lib/animal');

    describe("toObject()", function () {

        it("returns an object of values", function () {
            var testAnimalProps = {
                    sex: 'female',
                    petName: 'test'
                },
                testAnimal = new Animal(testSpecies, testAnimalProps);
            var testAnimalObject = testAnimal.toObject({isV1Format: false});
            expect(testAnimalObject).not.toBeUndefined('result should be defined');
            expect(_.isPlainObject(testAnimalObject)).toBe(true, 'result should be a plain object');
            _.forEach(testAnimalProps, function (propValue, propName) {
                expect(testAnimalObject[propName]).toEqual(propValue);
            });
        })
    });

    describe("getValue()", function(){
        it("returns the value of a prop per name", function(){
            var testAnimalProps = {
                    sex: 'male',
                    petName: 'valTester'
                },
                testAnimal = new Animal(testSpecies, testAnimalProps);

            _.forEach(testAnimalProps, function(propValue, propName){
                expect(testAnimal.getValue(propName)).toEqual(propValue);
            });

        })
    });

    describe("toQuery()", function () {

        it("returns a mongodb query object", function () {
            var testAnimalProps = {
                    sex: 'female',
                    petName: 'test'
                },
                testAnimal = new Animal(testSpecies, testAnimalProps);
            var testAnimalQuery = testAnimal.toQuery();
            expect(_.isPlainObject(testAnimalQuery)).toBe(true, 'query should be a plain object');
            _.forEach(testAnimalProps, function (queryFieldValue, queryFieldName) {
                expect(_.isRegExp(testAnimalQuery[queryFieldName])).toEqual(true);
            });
        })
    });
});
