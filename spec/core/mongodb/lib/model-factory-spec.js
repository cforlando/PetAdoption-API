var ModelFactory = require('../../../../core/mongodb/lib/model-factory'),
    Debuggable = require('../../../../core/lib/debuggable/index'),
    UserSchema = require('../../../../core/mongodb/schemas/user'),
    MongoDBAdapter = require('../../../../core/mongodb/lib/adapter');

describe("ModelFactory", function () {
    var dbAdapter,
        tUserProps = {id: 'test', firstName: 'hello', lastName: 'world'},
        user,
        aUser,
        UserModel;

    beforeAll(function (done) {
        dbAdapter = new MongoDBAdapter({
            debugLevel: Debuggable.PROD
        });
        dbAdapter.connect({
            onSuccess: function () {
                user = new ModelFactory('test_model_factory',
                    UserSchema,
                    {
                    debugTag: 'aSpecies: ',
                    debugLevel: Debuggable.PROD
                });
                UserModel = user.generateMongooseModel(dbAdapter);
                done();
            },
            onFailure: function () {
                throw new Error("Could not connect to DB")
            }
        })
    });

    afterAll(function (done) {
        UserModel.remove({}, function () {
            dbAdapter.close(function () {
                done();
            });
        });
    });

    describe("save()", function () {

        it("saves an object", function (done) {
            var tUser = new UserModel(tUserProps);
            tUser.save(function (err, savedUser) {
                if (err) throw err;
                aUser = savedUser;
                expect(aUser).not.toBeUndefined('No user was returned on save');
                expect(aUser.firstName).toEqual(tUserProps.firstName, 'The firstName was not correctly return in the saved user');
                expect(aUser.id).not.toBeUndefined('The ID was not defined in the saved user');
                done();
            });
        })
    });

    describe("findOne()", function () {
        it("returns a previously saved object", function (done) {
            UserModel.findOne({id: aUser.id})
                .lean()
                .exec(function (err, foundUser) {
                    if (err) throw err;
                    expect(foundUser).not.toBeUndefined('No user was found');
                    expect(foundUser.firstName).toEqual(tUserProps.firstName, 'The firstName was not correctly return in the found user');
                    expect(foundUser.id).not.toBeUndefined('The ID was not defined in the found user');
                    done()
                });

        })
    });

});
