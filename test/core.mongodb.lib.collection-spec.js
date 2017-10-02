var chai = require('chai');

var Collection = require('../core/mongodb/lib/collection');
var UserSchema = require('../core/mongodb/schemas/user');
var MongoDbAdapter = require('../core/mongodb/lib/adapter');

var expect = chai.expect;

describe("Collection", function () {
    var dbAdapter;
    var tUserProps = {id: 'test', firstName: 'hello', lastName: 'world'};
    var user;
    var aUser;
    var TestUserModel;

    before(function (done) {
        dbAdapter = new MongoDbAdapter();
        dbAdapter.connect({
            onSuccess: function () {
                user = new Collection('test_model_factory', UserSchema);
                TestUserModel = user.toMongooseModel(dbAdapter);
                done();
            },
            onFailure: function () {
                throw new Error("Could not connect to Db")
            }
        })
    });

    after(function (done) {
        TestUserModel.remove({}, function () {
            dbAdapter.close(function () {
                done();
            });
        });
    });

    describe("save()", function () {

        it("saves an object", function (done) {
            var tUser = new TestUserModel(tUserProps);
            tUser.save(function (err, savedUser) {
                if (err) throw err;
                aUser = savedUser;
                expect(aUser).to.exist;
                expect(aUser.firstName).to.eql(tUserProps.firstName, 'The firstName was not correctly return in the saved user');
                expect(aUser.id).to.exist;
                done();
            });
        })
    });

    describe("findOne()", function () {
        it("returns a previously saved object", function (done) {
            TestUserModel.findOne({id: aUser.id})
                .lean()
                .exec(function (err, foundUser) {
                    if (err) throw err;
                    expect(foundUser).to.exist;
                    expect(foundUser.firstName).to.eql(tUserProps.firstName, 'The firstName was not correctly return in the found user');
                    expect(foundUser.id).to.exist;
                    done()
                });

        })
    });

});
