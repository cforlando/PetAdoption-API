var _ = require('lodash'),

    Prop = require('../../../../core/lib/prop'),
    Debuggable = require('../../../../core/lib/debuggable');

describe("Prop", function () {
    var speciesModel = {
            test: {
                valType: 'String',
                defaultVal: 'defJam',
                key: 'test'
            }
        },
        propData = {
            val: 'success',
            valType: 'String',
            defaultVal: 'fail',
            key: 'test'
        },
        tProp;

    beforeAll(function () {
        tProp = new Prop(speciesModel, propData);
    });

    describe("getName()", function () {
        it("returns proper key", function () {
            expect(tProp.getName()).toEqual(propData.key);
        })
    });

    describe("getValue()", function () {

        it("returns proper saved value of prop", function () {
            expect(tProp.getValue()).toEqual(propData.val);
        })
    });
});
