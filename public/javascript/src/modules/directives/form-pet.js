define(['ngApp'], function (ngApp) {

    return ngApp.directive('petForm', function () {
        return {
            restrict: 'C',
            controller: ['$scope', '$element', '$http', '$mdToast', 'dataParserService',
                function ($scope, $element, $http, $mdToast, dataParserService) {
                    var $submitButton = $element.find('.btn-submit'),
                        $removeButton = $element.find('.btn-remove');

                    $removeButton.on('click', function (evt) {
                        evt.preventDefault();
                        $scope.deletePet();
                    });
                    
                    $submitButton.on('click', function (evt) {
                        evt.preventDefault();
                        $scope.savePet();
                    });
                    
                }]
        };
    });
});