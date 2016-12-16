var _ = require('lodash'),

    Database = require('./default'),
    config = require('../config'),

    ModelFactory = require('./lib/model-factory'),
    UserSchema = require('./schemas/user');

/**
 *
 * @extends Database
 * @param options
 * @constructor
 */
function UserDatabase(options) {
    var _options = _.defaults(options, {
        modelNamePrefix: config.DEVELOPMENT_ENV ? 'dev_' : 'prod_'
    });


    Database.call(this, new ModelFactory(_options.modelNamePrefix + 'users', UserSchema, {
        debugLevel: this.getDebugLevel(),
        modelNamePrefix: _options.modelNamePrefix
    }));
}

UserDatabase.prototype = {};

_.defaults(UserDatabase.prototype, Database.prototype);

module.exports = UserDatabase;
