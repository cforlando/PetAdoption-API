var _ = require('lodash'),
    ngApp = require('ngApp');

module.exports = ngApp.directive('dateInput', function () {
    return {
        restrict: 'C',
        template: require('raw!./templates/date-input.html')
    };
});
