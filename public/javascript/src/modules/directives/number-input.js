var _ = require('lodash');
var ngApp = require('ngApp');

module.exports = ngApp.directive('numberInput', function () {
    return {
        restrict: 'C',
        template: require('raw!./templates/number-input.html')
    };
});
