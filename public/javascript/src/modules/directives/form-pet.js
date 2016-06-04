define(['ngApp'], function (ngApp) {

    return ngApp.directive('petForm', function () {
        return {
            restrict: 'C',
            controller: ['$scope', '$element', '$http', '$mdToast', 'dataParserService',
                function ($scope, $element, $http, $mdToast, dataParserService) {
                    
                }]
        };
    });
});