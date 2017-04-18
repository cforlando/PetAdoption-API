var _ = require('lodash'),
    ngApp = require('ngApp');

module.exports = ngApp.directive('defaultSpeciesPropInput', function () {
    return {
        restrict: 'C',
        template: require('raw!./templates/default-species-prop-input.html'),
        controller: function ($scope) {
            $scope.getType = function () {
                return $scope.getPropType($scope.propData);
            }
        }
    }
});
