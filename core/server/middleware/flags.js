var _ = require('lodash');

var ServerUtils = require('../utils');

module.exports = function () {
    return function (req, res, next) {
        // set simplifiedFormat flag
        res.locals.simplifiedFormat = /^\/api\/v2/.test(req.originalUrl);

        // set reduceOutput flag
        switch (req.method) {
            case 'GET':
                res.locals.requestedProperties = (req.query.properties) ? ServerUtils.parseArrayStr(req.query.properties) : false;
                break;
            case 'POST':
                res.locals.requestedProperties = _.isArray(req.body.properties) ? req.body.properties : false;
                break;
            default:
                break;
        }

        next();

    }
};