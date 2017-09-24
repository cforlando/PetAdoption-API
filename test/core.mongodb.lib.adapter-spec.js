var expect = require('chai').expect;

var Debuggable = require('../core/lib/debuggable');
var MongoDbAdapter = require('../core/mongodb/lib/adapter');

describe('Adapter', function () {
    var dbAdapter;

    beforeEach(function () {
        dbAdapter = new MongoDbAdapter({
            debugLevel: Debuggable.PROD
        });
    });

    afterEach(function (done) {
        dbAdapter.close()
            .then(done)
            .catch(done)
    });


    describe("connect()", function () {

        it("executes option param onSuccess when connected", function (done) {
            dbAdapter.connect({
                onSuccess: function () {
                    done()
                },
                onFailure: function (err) {
                    done.fail(err || new Error('onFailure called'));
                }
            })
        });

        it("executes in the correct context when specified", function (done) {
            this.success = 'success';
            dbAdapter.connect({
                onSuccess: function () {
                    expect(this.success).to.eql('success');
                    done()
                },
                onFailure: function (err) {
                    done.fail(err || new Error('onFailure called'));
                },
                context: this
            })
        });

        it("emits 'connected' event when successfully connected", function (done) {

            dbAdapter.once('connected', function () {
                done()
            });
            dbAdapter.connect();
        });

    });

    it('returns the proper states', function (done) {

        expect(dbAdapter.isConnected()).to.equal(false);
        dbAdapter.connect({
            onSuccess: function () {
                expect(dbAdapter.isConnected()).to.equal(true);
                done();
            }
        })
    })
});
