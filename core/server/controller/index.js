var AuthController = require('./auth');
var APIController = require('./api');
/**
 *
 * @extends AuthController
 * @extends APIController
 * @class AppController
 * @param {MongoAPIDatabase} database
 * @param {Object} [options]
 * @returns {AppController}
 * @constructor
 */
function AppController(database, options) {
    this.api = new APIController(database, options);
    this.auth = new AuthController(database, options)
}

module.exports = AppController;
