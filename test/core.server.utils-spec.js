var _ = require('lodash'),
expect = require('expect.js');

describe("Server Utils", function () {
    var serverUtils = require('../core/server/utils');
    it("can parse an array string", function () {
        var testStrings = [
                "['test','hell']",
                "'test','hell'",
                "test,hell"
            ],
            result = ['test', 'hell'];

        testStrings.forEach(function (testString) {
            var resultArray = serverUtils.parseArrayStr(testString);
            expect(_.isArray(resultArray)).to.be(true);
            result.forEach(function(option){
                expect(_.includes(resultArray, option));
            });
        });

    });

    it("can parse a single string", function(){
        var testString = 'test_success',
            result = serverUtils.parseArrayStr(testString);

        expect(_.isArray(result)).to.be(true, 'result should be an array');
        expect(_.includes(result, testString));
    });
});