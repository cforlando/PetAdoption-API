define(['ngApp'], function(ngApp){

    return ngApp.directive('btnClearForm', function () {
        return {
            restrict: 'C',
            controller: ['$scope', '$element', function ($scope, $element) {
                $element.on('click', function () {
                    $scope.clearPetData();
                })
            }]
        }
    })
});