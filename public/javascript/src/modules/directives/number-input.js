var _ = require('lodash');
var ngApp = require('ngApp');

module.exports = ngApp.directive('numberInput', function () {
    return {
        restrict: 'C',
        template: require('raw-loader!./templates/number-input.html'),
        link: function ($scope) {
            $scope.propData.val = parseFloat($scope.propData.val);
        }
    };
});
