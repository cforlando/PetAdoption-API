var _ = require('lodash');
var chai = require('chai');

var expect = chai.expect;
var Species = require('../core/lib/species');

describe("Species", function () {

    it("has a baseProps property", function () {
        var aTestSpecies = new Species('testSpecies');
        expect(aTestSpecies.baseProps).not.to.be.undefined;
    });

    it("initializes with base properties", function () {
        var dTestSpecies = new Species('testSpecies');
        _.forEach(dTestSpecies.baseProps, function (basePropData) {
            expect(basePropData).to.eql(dTestSpecies.getProp(basePropData.key));
        });

        expect(dTestSpecies.getProps()).to.have.length.of.at.least(dTestSpecies.baseProps.length);
    });

    it("initializes with passed properties", function () {
        var aTestProp2Name = 'thePropName',
            testProps = [
                {
                    key: aTestProp2Name,
                    valType: 'string',
                    options: ['red', 'white', 'blue']
                }
            ],
            dTestSpecies = new Species('aSpecies', testProps);

        expect(dTestSpecies.getProp(aTestProp2Name)).to.eql(testProps[0]);
    });

    it("initializes props with a json string", function () {
        var aTestProp2Name = 'thePropName',
            testProps = [
                {
                    key: aTestProp2Name,
                    valType: 'string',
                    options: ['red', 'white', 'blue']
                }
            ],
            dTestSpecies = new Species('aSpecies', JSON.stringify(testProps));

        expect(dTestSpecies.getProp(aTestProp2Name)).to.eql(testProps[0]);
    });

    describe("getSpeciesName()", function () {
        var speciesName = 'cat',
            someSpecies = new Species(speciesName);

        it("returns the species name", function () {
            expect(someSpecies.getSpeciesName()).to.eql(speciesName);
        });
    });

    describe("setProps()", function () {
        var newTestPropName = 'aTestProp';
        var newTestPropVal = 'aTestPropValue';
        var bTestSpeciesProps = [
            {
                key: 'aPreviouslySavedProp',
                valType: 'string',
                val: 'aPreviouslySavedValue'
            },
            {
                key: 'aPreviouslySavedProp2',
                valType: 'string',
                val: 'aPreviouslySavedValue2'
            }
        ];
        var bTestSpecies = new Species('testSpecies', bTestSpeciesProps);
        var newTestProps = [
            {
                key: newTestPropName,
                valType: 'string',
                val: newTestPropVal
            }
        ];
        var overwrittingTestProps = [Object.assign({}, bTestSpeciesProps[1], {val: 'anOverwrittenSavedValue2'})];

        before(function () {

        });

        it("adds to the species' props", function () {
            var ogSpeciesProps = bTestSpecies.getProps();
            var newSpeciesProps;

            bTestSpecies.setProps(newTestProps);
            newSpeciesProps = bTestSpecies.getProps();

            expect(newSpeciesProps).to.have.lengthOf(ogSpeciesProps.length + 1, 'there should be one additional prop');
            expect(bTestSpecies.getProp(newTestPropName)).to.exist;

            ogSpeciesProps.forEach(function(propData){
                expect(newSpeciesProps).to.include(propData);
            })
        });

        it("overwrites pre-existing species' props", function () {
            var ogSpeciesProps = bTestSpecies.getProps();
            var newSpeciesProps;

            bTestSpecies.setProps(overwrittingTestProps);
            newSpeciesProps = bTestSpecies.getProps();

            expect(newSpeciesProps).to.have.lengthOf(ogSpeciesProps.length, 'there should the number of props');
            expect(bTestSpecies.getProp(newTestPropName)).to.exist;

            overwrittingTestProps.forEach(function(propData){
                expect(bTestSpecies.getProps()).to.include(propData);
            })
        })
    });

    describe("removeProp()", function () {
        var newTestPropName = 'aTestProp',
            anotherTestSpecies = new Species('testSpecies', [
                {
                    key: newTestPropName,
                    valType: 'string'
                }
            ]);

        it("deletes a species' prop", function () {
            var beforePropsLength = anotherTestSpecies.getProps().length;
            anotherTestSpecies.removeProp(newTestPropName);
            expect(anotherTestSpecies.getProps()).to.have.lengthOf(beforePropsLength - 1, 'there should be one less prop');
            expect(anotherTestSpecies.getProp(newTestPropName)).to.be.undefined;
        })
    });

    describe("getPropByKey()", function () {
        var newTestPropName = 'aTestProp',
            cTestSpecies = new Species('testSpecies'),
            testProps = [
                {
                    key: newTestPropName,
                    valType: 'string'
                }
            ];

        before(function () {
            cTestSpecies.setProps(testProps);
        });

        it("returns a specific prop per a provided key", function () {
            var testProp = cTestSpecies.getProp(newTestPropName);
            expect(testProp).to.eql(testProps[0]);
        })
    });

    describe("getProps()", function () {
        var newTestPropName = 'aTestProp',
            aTestSpecies = new Species('testSpecies'),
            testProps = [
                {
                    key: newTestPropName,
                    valType: 'string'
                }
            ];

        before(function () {
            aTestSpecies.setProps(testProps);
        });

        it("is an an array", function () {
            expect(aTestSpecies.getProps()).to.be.an('Array');
        })
    });
});