var _ = require('lodash');

module.exports = function(options) {
    return function(request, response, next){
        function formatResult(data) {

            return data.map(function (animalProps, index) {
                var _animalProps = {};
                _.forEach(animalProps, function (propData, propName) {
                    if (response.locals.reducedOuput && response.locals.reducedOuput.indexOf(propName) < 0) return;
                    _animalProps[propName] = (response.locals.simplifiedFormat) ? propData.val : propData;
                });
                return _animalProps;
            });
        }

        if (response.locals.data) {
            if (response.locals.simplifiedFormat || response.locals.reducedOuput) {
                response.json(formatResult(response.locals.data));
            } else {
                response.json(response.locals.data);
            }
        } else {
            next()
        }
    }
};
