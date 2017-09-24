var chai = require('chai');
var _ = require('lodash');

var expect = chai.expect;

var AnimalQuery = require('../core/lib/query');

describe("AnimalQuery", function () {
    var testQueryProps = [
        {
            key: 'propName',
            valType: 'String',
            val: 'testValue'
        },
        {
            key: 'anotherPropName',
            valType: 'Number',
            val: '2'
        }
    ];

    it("accepts an array of props", function () {
        var testQuery = new AnimalQuery(testQueryProps);
        var testQueryData = testQuery.toFormattedObject();
        var testAnotherPropNameVal = _.find(testQueryProps, {key: 'anotherPropName'}).val;

        expect(testQueryData.propName.val).to.match(/testValue/);
        expect(testQueryData.anotherPropName.val).to.eql(parseInt(testAnotherPropNameVal));
    });
});