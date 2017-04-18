var ngApp = require('ngApp');
var Species = require('species');
var _ = require('lodash');

ngApp.service('speciesFactory', function () {

    function SpeciesFactory() {

    }

    SpeciesFactory.prototype = {
        createTemplate: function (speciesName, props) {
            return new Species(speciesName, props);
        }
    };

    return new SpeciesFactory();
});

module.exports = ngApp;
