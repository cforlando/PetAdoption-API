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
            _.forEach(testAnimalProps, function(propValue, propName){
                expect(testAnimalObject[propName]).toEqual(propValue);
            });
        })
    })
});
