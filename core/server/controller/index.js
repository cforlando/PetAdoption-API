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
    AuthController.apply(this, arguments);
    APIController.apply(this, arguments);
}

AppController.prototype = Object.assign({}, AuthController.prototype, APIController.prototype);

module.exports = AppController;
