var _ = require('lodash'),
    ngApp = require('ngApp');

module.exports = ngApp.directive('autoInput', function () {
    return {
        restrict: 'C',
        template: require('raw-loader!./templates/auto-input.html'),
        controller: function ($scope) {

            $scope.getType = function (propData) {
                return $scope.getPropType(propData || $scope.propData);
            };

            $scope.isResetable = function (propData) {
                return $scope.isPropResetable(propData || $scope.propData);
            }

        }
    }
})
