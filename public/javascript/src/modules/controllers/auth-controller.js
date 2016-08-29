define([
    'require',
    'ngApp'
], function(require){
    var ngApp = require('ngApp');
    ngApp.controller('authController', ['$scope',
        function($scope){
            $scope.login = function(){
                location.href = '/api/v1/auth/google';
            }
        }])
});