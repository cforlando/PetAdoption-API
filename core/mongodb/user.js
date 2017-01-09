var _ = require('lodash'),

    Database = require('./default'),
    config = require('../config'),

    Collection = require('./lib/collection'),
    UserSchema = require('./schemas/user');

/**
 *
 * @extends Database
 * @param options
 * @constructor
 */
function UserDatabase(options) {
    var _options = _.defaults(options, {
            collectionNamePrefix: config.DEVELOPMENT_ENV ? 'dev_' : 'prod_'
        }),
        collectionName = _options.collectionNamePrefix + 'users';

    this.collection = new Collection(collectionName, UserSchema, {
        debugLevel: this.getDebugLevel(),
        collectionNamePrefix: _options.collectionNamePrefix
    });
    Database.call(this, this.collection);
}

UserDatabase.prototype = {};

_.defaults(UserDatabase.prototype, Database.prototype);

module.exports = UserDatabase;
