var _ = require('lodash');
describe("Server Utils", function () {
    var serverUtils = require('../../../../core/server/utils');
    it("can parse an array string", function () {
        var testStrings = [
                "['test','hell']",
                "'test','hell'",
                "test,hell"
            ],
            result = ['test', 'hell'];

        testStrings.forEach(function (testString) {
            var resultArray = serverUtils.parseArrayStr(testString);
            expect(_.isArray(resultArray)).toBe(true);
            result.forEach(function(option){
                expect(_.includes(resultArray, option));
            });
        });

    });

    it("can parse a single string", function(){
        var testString = 'test_success',
            result = serverUtils.parseArrayStr(testString);

        expect(_.isArray(result)).toBe(true, 'result should be an array');
        expect(_.includes(result, testString));
    });
});