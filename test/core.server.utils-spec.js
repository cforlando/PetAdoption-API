var _ = require('lodash');
var chai = require('chai');

var expect = chai.expect;

describe("Server Utils", function () {
    var serverUtils = require('../core/server/utils');
    it("can parse an array string", function () {
        var testStrings = [
            "['test','hell']",
            "'test','hell'",
            "test,hell"
        ];
        var expectedResult = ['test', 'hell'];

        testStrings.forEach(function (testString) {
            var resultArray = serverUtils.parseArrayStr(testString);
            expect(resultArray).to.be.an('Array');
            expectedResult.forEach(function (expectedResultMember) {
                expect(resultArray).to.include(expectedResultMember);
            })
        });

    });

    it("can parse a single string", function () {
        var testString = 'test_success';
        var result = serverUtils.parseArrayStr(testString);

        expect(result).to.be.an('Array');
        expect(result).to.include(testString);
    });
});