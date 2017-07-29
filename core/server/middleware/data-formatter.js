var _ = require('lodash');

module.exports = function (options) {
    return function (req, res, next) {
        var formatter = function (animalProps) {
            return _.reduce(animalProps, function (collection, propData, propName) {
                // only respond with values requested in properties field
                if (res.locals.requestedProperties && res.locals.requestedProperties.includes(propName)) {
                    collection[propName] = res.locals.simplifiedFormat ? propData.val : propData;
                }

                return collection;
            }, {});
        };

        if (res.locals.data && (res.locals.simplifiedFormat || res.locals.requestedProperties)) {
            res.json(res.locals.data.map(formatter));
        } else if (res.locals.data)  {
            res.json(res.locals.data);
        } else {
            next()
        }
    }
};
