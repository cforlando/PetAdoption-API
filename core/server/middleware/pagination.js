var _ = require('lodash');

module.exports = function (options) {
    var opts = _.defaults(options, {
        pageSize: 10
    });

    return function (req, res, next) {
        var pageSize = parseInt(req.query.pageSize || req.body.pageSize || opts.pageSize);
        var pageNumber = parseInt(res.locals.pageNumber);
        var arrayStartIndex;

        if (_.isFinite(pageNumber) && _.isArray(res.locals.data) && res.locals.data.length > pageSize) {
            arrayStartIndex = pageNumber > 0 ? 0 : (pageNumber - 1) * pageSize;

            res.locals.data = res.locals.data.slice(arrayStartIndex, arrayStartIndex + pageSize);
        }

        next();
    }
};