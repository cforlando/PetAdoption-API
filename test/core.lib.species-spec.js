var _ = require('lodash'),
    expect = require('expect.js'),

    Species = require('../core/lib/species');

describe("Species", function () {

    it("has a baseProps property", function () {
        var aTestSpecies = new Species('testSpecies');
        expect(aTestSpecies.baseProps).not.to.be(undefined, 'baseProps should be defined');
    });

    it("initializes with base properties", function () {
        var dTestSpecies = new Species('testSpecies');
        _.forEach(dTestSpecies.baseProps, function (basePropData) {
            expect(basePropData).to.equal(dTestSpecies.getProp(basePropData.key));
        });

        expect(dTestSpecies.getProps().length).not.to.be.lessThan(dTestSpecies.baseProps.length);
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

        expect(dTestSpecies.getProp(aTestProp2Name)).to.equal(testProps[0]);
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

        expect(dTestSpecies.getProp(aTestProp2Name)).to.eql(testProps[0]);
    });

    describe("getSpeciesName()", function(){
        var speciesName = 'cat',
            someSpecies = new Species(speciesName);

        it("returns the species name", function(){
            expect(someSpecies.getSpeciesName()).to.equal(speciesName);
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
            expect(bTestSpecies.getProps().length).to.equal(beforePropsLength + 1, 'there should be one additional prop');
            expect(bTestSpecies.getProp(newTestPropName)).not.to.be(undefined);
        })
    });

    describe("removeProp()", function(){
        var newTestPropName = 'aTestProp',
            anotherTestSpecies = new Species('testSpecies', [
                {
                    key: newTestPropName,
                    valType: 'String'
                }
            ]);

        it("deletes a species' prop", function () {
            var beforePropsLength = anotherTestSpecies.getProps().length;
            anotherTestSpecies.removeProp(newTestPropName);
            expect(anotherTestSpecies.getProps().length).to.equal(beforePropsLength - 1, 'there should be one less prop');
            expect(anotherTestSpecies.getProp(newTestPropName)).to.be(undefined);
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

        before(function () {
            cTestSpecies.setProps(testProps);
        });

        it("returns a specific prop per a provided key", function () {
            var testProp = cTestSpecies.getProp(newTestPropName);
            expect(testProp).to.equal(testProps[0]);
        })
    });

    describe("getProps()", function () {
        var newTestPropName = 'aTestProp',
            aTestSpecies = new Species('testSpecies'),
            testProps = [
                {
                    key: newTestPropName,
                    valType: 'String'
                }
            ];

        before(function () {
            aTestSpecies.setProps(testProps);
        });

        it("is an an array", function () {
            expect(_.isArray(aTestSpecies.getProps())).to.be(true, 'result should be an array');
        })
    });
});