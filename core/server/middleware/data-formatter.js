var _ = require('lodash');

module.exports = function (options) {
    return function (req, res, next) {
        var formatter = function (animalProps) {
            return _.reduce(animalProps, function (collection, propData, propName) {
                 if (!res.locals.requestedProperties) {
                    collection[propName] = res.locals.simplifiedFormat ? propData.val : propData;
                } else if (res.locals.requestedProperties.includes(propName)) {
                     // only respond with values requested in properties field
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
