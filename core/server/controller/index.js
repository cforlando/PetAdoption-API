var _ = require('lodash'),

    Debuggable = require('../../lib/debuggable'),
    AuthController = require('./auth'),
    APIController = require('./api');
/**
 *
 * @extends AuthController
 * @extends APIController
 * @class AppController
 * @param {MongoAPIDatabase} database
 * @param {Object} [options]
 * @param {DebugLevel} [options.debugLevel=Debuggable.PROD]
 * @returns {AppController}
 * @constructor
 */
function AppController(database, options){
    this.setDebugTag('AppController: ');
    AuthController.apply(this, arguments);
    APIController.apply(this, arguments);
    this.log(Debuggable.MED, 'AppController()');
    return this;
}

_.extend(AppController.prototype, AuthController.prototype, APIController.prototype);

module.exports = AppController;
