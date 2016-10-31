define([
    'require',
    'underscore',
    'text!./views/auto-input.html',
    'ngApp'
], function (require) {
    var _ = require('underscore'),
        ngApp = require('ngApp');

    ngApp.directive('autoInput', function () {
        return {
            restrict: 'C',
            template: require('text!./views/auto-input.html'),
            controller : ['$scope', function($scope){
                $scope.getType = function(){
                    return $scope.$parent.getPropType($scope.propData);
                }

                $scope.isResetable = function(){
                    return $scope.$parent.isPropResetable($scope.propData);
                }

            }]
        }
    })

    return ngApp;
})
