define([
    'require',
    'underscore',
    'text!./views/auto-default-input.html',
    'ngApp'
], function (require) {
    var _ = require('underscore'),
        ngApp = require('ngApp');

    ngApp.directive('autoDefaultInput', function () {
        return {
            restrict: 'C',
            template: require('text!./views/auto-default-input.html'),
            controller : ['$scope', function($scope){
               $scope.getType = function(){
                   return $scope.$parent.getPropType($scope.propData);
               }
            }]
        }
    })

    return ngApp;
})
