var _ = require('lodash'),
    ngApp = require('ngApp');

module.exports = ngApp.directive('dateInput', function () {
    return {
        restrict: 'C',
        template: require('raw-loader!./templates/date-input.html')
    };
});
