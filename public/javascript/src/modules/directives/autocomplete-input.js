var _ = require('lodash'),
    ngApp = require('ngApp');

module.exports = ngApp.directive('autocompleteInput', function () {
    return {
        restrict: 'C',
        template: require('raw-loader!./templates/autocomplete-input.html')
    };
});
