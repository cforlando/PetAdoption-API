var _ = require('lodash'),
    ngApp = require('ngApp');

module.exports = ngApp.directive('defaultSpeciesPropInput', function () {
    return {
        restrict: 'C',
        template: require('raw-loader!./templates/default-species-prop-input.html'),
        controller: function ($scope, animalDataService) {
            $scope.getType = function () {
                return animalDataService.getPropType($scope.propData);
            }
        }
    }
});
