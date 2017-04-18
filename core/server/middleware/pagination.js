var _ = require('lodash');

module.exports = function (options) {
    var opts = _.defaults(options, {
        pageSize: 10
    });

    return function (req, res, next) {
        var pageSize = parseInt(req.query.pageSize || req.body.pageSize || opts.pageSize);
        var pageNum;
        var startIndex;

        if (_.isFinite(parseInt(res.locals.pageNumber)) && _.isArray(res.locals.data) && res.locals.data.length > pageSize) {
            pageNum = (function () {
                var parsedPageNum = (parseInt(res.locals.pageNumber) || 1) - 1; // page numbers start at 1

                if (parsedPageNum < 0) {
                    return 0;
                }

                return parsedPageNum;
            })();
            startIndex = pageNum * pageSize;

            res.locals.data = res.locals.data.slice(startIndex, startIndex + pageSize);
        }

        next();
    }
};