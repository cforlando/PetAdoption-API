var _ = require('lodash'),

    Species = require('../../../core/lib/species');

describe("Species", function () {

    it("has a baseProps property", function () {
        var aTestSpecies = new Species('testSpecies');
        expect(aTestSpecies.baseProps).not.toBeUndefined('baseProps should be defined');
    });

    it("initializes with base properties", function () {
        var dTestSpecies = new Species('testSpecies');
        _.forEach(dTestSpecies.baseProps, function (basePropData) {
            expect(basePropData).toEqual(dTestSpecies.getProp(basePropData.key));
        });

        expect(dTestSpecies.getProps().length).not.toBeLessThan(dTestSpecies.baseProps.length);
    });

    it("initializes with passed properties", function () {
        var aTestProp2Name = 'thePropName',
            testProps = [
                {
                    key: aTestProp2Name,
                    valType: 'String',
                    options: ['red', 'white', 'blue']
                }
            ],
            dTestSpecies = new Species('aSpecies', testProps);

        expect(dTestSpecies.getProp(aTestProp2Name)).toEqual(testProps[0]);
    });

    it("initializes props with a json string", function () {
        var aTestProp2Name = 'thePropName',
            testProps = [
                {
                    key: aTestProp2Name,
                    valType: 'String',
                    options: ['red', 'white', 'blue']
                }
            ],
            dTestSpecies = new Species('aSpecies', JSON.stringify(testProps));

        expect(dTestSpecies.getProp(aTestProp2Name)).toEqual(testProps[0]);
    });

    describe("getName()", function(){
        var speciesName = 'cat',
            someSpecies = new Species(speciesName);

        it("returns the species name", function(){
            expect(someSpecies.getName()).toEqual(speciesName);
        });
    });

    describe("setProps()", function () {
        var newTestPropName = 'aTestProp',
            bTestSpecies = new Species('testSpecies'),
            testProps = [
                {
                    key: newTestPropName,
                    valType: 'String'
                }
            ];

        it("sets the species' props", function () {
            var beforePropsLength = bTestSpecies.getProps().length;
            bTestSpecies.setProps(testProps);
            expect(bTestSpecies.getProps().length).toEqual(beforePropsLength + 1, 'there should be one additional prop');
            expect(bTestSpecies.getProp(newTestPropName)).not.toBeUndefined();
        })
    });

    describe("getPropByKey()", function () {
        var newTestPropName = 'aTestProp',
            cTestSpecies = new Species('testSpecies'),
            testProps = [
                {
                    key: newTestPropName,
                    valType: 'String'
                }
            ];

        beforeAll(function () {
            cTestSpecies.setProps(testProps);
        });

        it("returns a specific prop per a provided key", function () {
            var testProp = cTestSpecies.getProp(newTestPropName);
            expect(testProp).toEqual(testProps[0]);
        })
    });

    describe("getProps()", function () {
        var newTestPropName = 'aTestProp',
            eTestSpecies = new Species('testSpecies'),
            testProps = [
                {
                    key: newTestPropName,
                    valType: 'String'
                }
            ];

        beforeAll(function () {
            eTestSpecies.setProps(testProps);
        });

        it("is an an array", function () {
            expect(_.isArray(eTestSpecies.getProps())).toBe(true, 'result should be an array');
        })
    });
});