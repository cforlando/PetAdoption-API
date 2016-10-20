var Controller = require('../controller'),
    ViewRouter = require('./view'),
    APIRouter = require('./api');

/**
 *
 * @class Router
 * @param {MongoAPIDatabase} database
 * @param {Object} [options]
 * @param {DebugLevel} [options.debugLevel]
 * @returns {Router}
 * @constructor
 */
function Router(database, options){

    this.controller = new Controller(database, options);

    this.view = new ViewRouter(this.controller);
    this.api = new APIRouter(this.controller);
    return this;
}

module.exports = Router;
