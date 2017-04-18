var _ = require('lodash'),
    ngApp = require('ngApp');

module.exports = ngApp.directive('autocompleteInput', function () {
    return {
        restrict: 'C',
        template: require('raw!./templates/autocomplete-input.html')
    };
});
