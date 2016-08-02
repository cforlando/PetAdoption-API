define([
    'require',
    'underscore',
    'text!./views/date-input.html',
    'ngApp'
], function (require) {
    var _ = require('underscore'),
        ngApp = require('ngApp');

    return ngApp.directive('dateInput', function () {
        return {
            restrict: 'EC',
            template : require('text!./views/date-input.html'),
            controller: ['$scope',
                function ($scope) {
                    $scope.$watch('propData.val', function(){
                        $scope.setField($scope.propData.key, $scope.propData);
                    })
                }]
        };
    });
});