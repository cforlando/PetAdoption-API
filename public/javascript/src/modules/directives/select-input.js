var _ = require('lodash');
var ngApp = require('ngApp');

module.exports = ngApp.directive('selectInput', function () {
    return {
        restrict: 'C',
        template: require('raw-loader!./templates/select-input.html'),
        controller: function ($scope, $element, speciesDataService) {

            if ($scope.propData.valType === 'boolean' && !($scope.propData.options && $scope.propData.options.length)) {
                $scope.propData.options = [true, false];
            }

            if ($scope.propData.key === 'species') {
                speciesDataService.getSpeciesList()
                    .then(function (speciesList) {
                        $scope.propData.options = speciesList;
                    })
            }
        }
    };
});
