define(['ngApp'], function(ngApp){
    return ngApp.directive('fabToggle',[function(){
        return {
            restrict: 'C',
            controller: ['$scope', '$element', function ($scope, $element) {
                $element.on('click', function () {
                    $scope.fab.isOpen = !$scope.fab.isOpen;
                })
            }]
        }
    }]);
});