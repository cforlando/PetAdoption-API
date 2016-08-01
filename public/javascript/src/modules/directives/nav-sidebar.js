define([
    'require',
    'ngApp',
    'underscore'
], function (require) {
    var ngApp = require('ngApp'),
        _ = require('underscore');
    return ngApp.directive('listSideNav', [function () {
        return {
            restrict: 'C',
            controller: ['$scope', '$element', '$http',
                function ($scope, $element, $http) {
                    $scope.$watch('petData.species.val', function (newValue, oldValue) {
                        if(_.indexOf($scope.speciesList, newValue) > -1){
                            $scope.petData.species.val = newValue;
                            $scope.getPetList();
                        }
                    })
                }]
        }
    }]);
});