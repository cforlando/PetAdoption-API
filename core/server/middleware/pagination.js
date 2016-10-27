var _ = require('lodash');

module.exports = function(options){
    var _options = _.defaults(options, {
        pageSize: 10
    });
    return function(request, response, next){
        var pageNum = (function () {
                var parsedPageNum = (parseInt(response.locals.pageNumber) || 1) - 1; // page numbers start at 1
                if (parsedPageNum < 0) return 0;
                return parsedPageNum;
            })(),
            _pageSize = parseInt(request.query['pageSize'] || request.body['pageSize'] || _options.pageSize),
            _startIndex = pageNum * _pageSize;

        if (_.isFinite(parseInt(response.locals.pageNumber)) && _.isArray(response.locals.data) && response.locals.data.length > _pageSize) {
            response.locals.data = response.locals.data.slice(_startIndex, _startIndex + _pageSize);
        }
        next();
    }
};