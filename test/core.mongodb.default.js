var expect = require('expect.js'),

    Database = require('../core/mongodb/default'),
    Collection = require('../core/mongodb/lib/collection'),
    Debuggable = require('../core/lib/debuggable');

describe.only('Database', function () {
    var dbInstance,
        TestSchema = {test: String};

    before(function () {
        dbInstance = new Database(new Collection('test', TestSchema));
    });

    afterEach(function (done) {
        dbInstance.stop(function () {
            done()
        });
    });

    describe("exec()", function () {

        it("executes a function when db is ready", function (done) {
            dbInstance.exec(function () {
                done();
            });
        })
    });
});
