var chai = require('chai');

var Database = require('../core/mongodb/lib/database');
var Collection = require('../core/mongodb/lib/collection');

var expect = chai.expect;

describe('BaseDatabase', function () {
    var dbInstance;
    var TestSchema = {test: String};

    before(function () {
        dbInstance = new Database(new Collection('test', TestSchema));
    });

    afterEach(function () {
        return dbInstance.stop();
    });

    describe("exec()", function () {

        it("executes a function when db is ready", function (done) {
            dbInstance.exec(function () {
                done();
            });
            dbInstance.initDatabase();
        })
    });
});
