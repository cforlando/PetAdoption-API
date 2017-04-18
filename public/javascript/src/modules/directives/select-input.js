var _ = require('lodash');
var ngApp = require('ngApp');

module.exports = ngApp.directive('selectInput', function () {
    return {
        restrict: 'C',
        template: require('raw!./templates/select-input.html'),
        controller: function ($scope, $element, speciesDataService) {

            if ($scope['propData'].valType === 'Boolean' && $scope['propData'].options.length === 0) {
                $scope['propData'].options = [true, false];
                console.log("setting %s options w/ %o", $scope['propData'].key, $scope['propData']);
            }

            if ($scope['propData'].key === 'species') {
                speciesDataService.getSpeciesList()
                    .then(function (speciesList) {
                        console.log("!setting species options w/ %o", speciesList);
                        $scope['propData'].options = speciesList;
                    })
            }
        }
    };
});
