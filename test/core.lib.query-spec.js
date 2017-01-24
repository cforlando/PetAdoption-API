var expect = require('expect.js');

describe("AnimalQuery", function(){
    var AnimalQuery = require('../core/lib/query');

    it("accepts an array of props", function(){
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
            ],
            testQuery = new AnimalQuery(testQueryProps),
            testQueryData = testQuery.toFormattedObject();

        expect(testQueryData.propName.val).to.match(/testValue/);
        expect(testQueryData.anotherPropName.val).to.equal(2);
    });
});