define(['ngApp'], function (ngApp) {
    return ngApp.directive('listSideNav', [function () {
        return {
            restrict: 'C',
            controller: ['$scope', '$element', '$http',
                function ($scope, $element, $http) {
                    $scope.$watch('visiblePetType', function () {
                        $scope.getPetList();
                    })
                }]
        }
    }]);
});