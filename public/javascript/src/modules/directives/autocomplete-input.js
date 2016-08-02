define([
    'require',
    'underscore',
    'text!./views/autocomplete-input.html',
    'ngApp'
], function (require) {
    var _ = require('underscore'),
        ngApp = require('ngApp');

    return ngApp.directive('autocompleteInput', function () {
        return {
            restrict: 'C',
            template : require('text!./views/autocomplete-input.html'),
            controller: ['$scope',
                function ($scope) {
                    $scope.saveValue = function(){
                        $scope.setField($scope.propData.key, $scope.propData);
                    }
                }]
        };
    });
});