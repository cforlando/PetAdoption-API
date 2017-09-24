var ngApp = require('ngApp');
var _ = require('lodash');

ngApp.filter('species', function () {
    return function (animals, speciesName) {
        return _.filter(animals, function (animal) {
            return animal.getSpeciesName() === speciesName;
        });
    }
});

module.exports = ngApp;
