define(['ngApp'], function(ngApp){

    return ngApp.directive('inputSubmit', function () {
        return {
            restrict: 'C',
            controller: ['$scope', '$element', function ($scope, $element) {
                // $element.on('click', function () {
                //     console.log('submit');
                //     $scope.$emit('submit');
                // })
            }]
        };
    });
});