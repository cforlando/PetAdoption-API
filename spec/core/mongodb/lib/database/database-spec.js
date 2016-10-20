var Database = require('../../../../../core/mongodb/lib/database'),
    ModelFactory = require('../../../../../core/mongodb/lib/model-factory'),
    Debuggable = require('../../../../../core/lib/debuggable');

describe('DBInstance', function () {
    var dbInstance;

    beforeAll(function () {
        dbInstance = new Database(new ModelFactory('test', {test: String}));
    });

    afterEach(function(done){
        // TODO fix test not quit on completion
        dbInstance.stop(function(){
            done()
        });
    });

    describe("ready()", function () {

        it("executes callback", function (done) {
            dbInstance.onDBAdapterConnected(function () {
                done()
            })
        });

    });

    describe("exec()", function () {
        beforeAll(function (done) {
            dbInstance.onDBAdapterConnected(function () {
                done();
            })
        });

        it("executes a function when db is ready", function (done) {
            dbInstance.exec(function () {
                done();
            });
            dbInstance.start();
        })
    });
});
