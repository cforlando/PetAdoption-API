var _ = require('lodash');
var chai = require('chai');

var Species = require('../core/lib/species');
var TestHelper = require('./helper')._global;

var expect = chai.expect;
var testData = TestHelper.getTestDbImages();
var testSpeciesImage = testData[0];
var testSpecies = new Species(testSpeciesImage.getSpeciesName(), testSpeciesImage.getSpeciesProps());

describe("Animal", function () {
    var Animal = require('../core/lib/animal');

    describe("toObject()", function () {

        it("returns an object of values", function () {
            var testAnimalProps = {
                sex: 'female',
                petName: 'test'
            };
            var testAnimal = new Animal(testSpecies, testAnimalProps);
            var testAnimalObject = testAnimal.toObject({isV1Format: false});

            expect(testAnimalObject).not.to.be.undefined;
            expect(testAnimalObject).to.be.an('Object', 'result should be a plain object');
            _.forEach(testAnimalProps, function (propValue, propName) {
                expect(testAnimalObject[propName]).to.eql(propValue);
            });
        })
    });

    describe("getValue()", function () {
        it("returns the value of a prop per name", function () {
            var testAnimalProps = {
                sex: 'male',
                petName: 'valTester'
            };
            var testAnimal = new Animal(testSpecies, testAnimalProps);

            _.forEach(testAnimalProps, function (propValue, propName) {
                expect(testAnimal.getValue(propName)).to.eql(propValue);
            });

        })
    });

    describe("toQuery()", function () {

        it("returns a mongodb friendly object", function () {
            var testAnimalProps = {
                    sex: 'female',
                    petName: 'test'
                },
                testAnimal = new Animal(testSpecies, testAnimalProps),
                testAnimalQuery = testAnimal.toQuery();

            expect(testAnimalQuery).to.be.an('Object');

            // $all and $elemMatch are mongo helper properties
            testAnimalQuery.props.$all.forEach(function (propQuery) {
                var queryFieldName = propQuery.$elemMatch.key;
                var queryFieldValue = propQuery.$elemMatch.val;

                if (queryFieldName == 'species') {
                    // ignore auto generated species prop
                    return;
                }

                expect(testAnimalProps[queryFieldName]).to.exist;
                expect(queryFieldValue).to.be.a('RegExp');
            });
        })
    });
});
