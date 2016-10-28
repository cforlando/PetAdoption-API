var _ = require('lodash');

module.exports = function(options) {
    return function(request, response, next){
        var formatter = function (animalProps) {
            return _.reduce(animalProps, function (collection, propData, propName) {
                if (response.locals.reducedOuput && response.locals.reducedOuput.indexOf(propName) < 0) return collection;
                collection[propName] = (response.locals.simplifiedFormat) ? propData.val : propData;
                return collection;
            }, {});
        };

        if (response.locals.data) {
            if (response.locals.simplifiedFormat || response.locals.reducedOuput) {
                response.json(response.locals.data.map(formatter));
            } else {
                response.json(response.locals.data);
            }
        } else {
            next()
        }
    }
};
