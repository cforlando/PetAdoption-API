var Controller = require('../controller');
var ViewRouter = require('./view');
var APIRouter = require('./api');

/**
 *
 * @class ServerRouter
 * @param {MongoAPIDatabase} database
 * @param {Object} [options]
 * @returns {ServerRouter}
 * @constructor
 */
function ServerRouter(database, options) {

    this.controller = new Controller(database, options);

    this.view = new ViewRouter(this.controller);
    this.api = new APIRouter(this.controller);
    return this;
}

module.exports = ServerRouter;
