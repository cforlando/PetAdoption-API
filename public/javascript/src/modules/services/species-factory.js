define([
    'require',
    'underscore',
    'species',
    'ngApp'
], function (require) {
    var ngApp = require('ngApp'),
        Species = require('species'),
        _ = require('underscore');

    return ngApp.service('speciesFactory', function () {

        function SpeciesFactory() {

        }

        SpeciesFactory.prototype = {
            createTemplate: function (speciesName) {
                return new Species(speciesName);
            }
        };

        return new SpeciesFactory();
    });

});