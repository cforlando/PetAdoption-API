var _ = require('lodash'),

    Database = require('./default'),

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
        modelNamePrefix: 'species_collection'
    });


    Database.call(this, new ModelFactory('users', UserSchema, {
        debugLevel: this.getDebugLevel(),
        modelNamePrefix: _options.modelNamePrefix
    }));
}

UserDatabase.prototype = {};

_.defaults(UserDatabase.prototype, Database.prototype);

module.exports = UserDatabase;
