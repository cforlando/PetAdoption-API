var _ = require('lodash');
describe("Server Utils", function(){
    var serverUtils = require('../../../../core/server/utils');
    it("can parse an array string", function(){
        expect(_.isArray(serverUtils.parseArrayStr("['test','hell']"))).toBe(true);
    })
});