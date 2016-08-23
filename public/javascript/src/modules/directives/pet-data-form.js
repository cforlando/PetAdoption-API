define([
    'require',
    'underscore',
    'text!./views/pet-form.html',
    'ngApp'
], function (require) {
    var _ = require('underscore'),
        ngApp = require('ngApp');

    return ngApp.directive('petDataForm', function () {
        return {
            restrict: 'C',
            template : require('text!./views/pet-form.html'),
            replace : true,
            controller: ['$scope', '$element', '$http', '$timeout', 'dataParserService',
                function ($scope, $element, $http, $timeout, dataParserService) {
                    console.log("petDataForm.$scope: %o", $scope);

                    /**
                     *
                     * @param {Object} model
                     */
                    function updateProperties(model){
                        var renderData = dataParserService.formatRenderData(model);
                        console.log('rendering: %o', renderData);
                        $scope.properties = renderData;
                    }

                    $scope.$on('update:petData', function(){
                        $timeout(function(){
                            updateProperties($scope.petData);
                        });
                    });
                }]
        };
    });
});