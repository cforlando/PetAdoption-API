var _ = require('lodash'),

    ServerUtils = require('../utils');

module.exports = function () {
    return function (req, res, next) {
        // set simplifiedFormat flag
        res.locals.simplifiedFormat = /^\/api\/v2\/(list|query)/.test(req.path);

        // set reduceOutput flag
        switch (req.method) {
            case 'GET':
                res.locals.reducedOuput = (req.query.properties) ? ServerUtils.parseArrayStr(req.query.properties) : false;
                break;
            case 'POST':
                res.locals.reducedOuput = (_.isArray(req.body.properties)) ? req.body.properties : false;
                break;
            default:
                break;
        }

        next();

    }
};