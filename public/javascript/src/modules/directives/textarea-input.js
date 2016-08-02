define([
    'require',
    'underscore',
    'text!./views/textarea-input.html',
    'ngApp'
], function (require) {
    var _ = require('underscore'),
        ngApp = require('ngApp');

    return ngApp.directive('textareaInput', function () {
        return {
            restrict: 'EC',
            template : require('text!./views/textarea-input.html'),
            controller: ['$scope',
                function ($scope) {
                    $scope.$watch('propData.val', function(){
                        $scope.setField($scope.propData.key, $scope.propData);
                    })
                }]
        };
    });
});