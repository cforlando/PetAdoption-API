var _ = require('lodash'),

    BaseDatabase = require('./lib/database'),
    config = require('../config'),

    Collection = require('./lib/collection'),
    UserSchema = require('./schemas/user');

/**
 *
 * @extends BaseDatabase
 * @param options
 * @constructor
 */
function UserDatabase(options) {
    var _options = _.defaults(options, {
        collectionNamePrefix: config.DEVELOPMENT_ENV ? 'dev_' : 'prod_'
    });
    var collectionName = _options.collectionNamePrefix + 'users';
    var collection = new Collection(collectionName, UserSchema, {
        collectionNamePrefix: _options.collectionNamePrefix
    });

    BaseDatabase.call(this, collection);

    this.initDatabase();
}

UserDatabase.prototype = {};

_.defaults(UserDatabase.prototype, BaseDatabase.prototype);

module.exports = UserDatabase;
