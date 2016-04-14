define(['ngApp'], function(ngApp){

    return ngApp.directive('btnClearForm', function () {
        return {
            restrict: 'C',
            controller: ['$scope', '$element', function ($scope, $element) {
                $element.on('click', function () {
                    for (var prop in $scope.petData) {
                        if ($scope.petData.hasOwnProperty(prop)) {
                            $scope.petData[prop]['example'] = null;
                        }
                    }
                })
            }]
        }
    })
});