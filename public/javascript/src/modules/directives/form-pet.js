define([
    'require',
    'underscore',
    'ngApp'
], function (require) {
    var _ = require('underscore'),
        ngApp = require('ngApp');

    return ngApp.directive('petForm', function () {
        return {
            restrict: 'C',
            controller: ['$scope', '$element', '$http', '$mdDialog',
                function ($scope, $element, $http, $mdDialog) {



                }]
        };
    });
});