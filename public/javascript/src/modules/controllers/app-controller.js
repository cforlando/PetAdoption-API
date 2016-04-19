define([
    'require',
    'underscore',
    'ngApp'
], function (require) {
    var ngApp = require('ngApp'),
        _ = require('underscore');

    return ngApp.controller('appController', ['$scope', '$http', '$mdToast',
        function ($scope, $http, $mdToast) {
            $scope.isLoading = false;
            $scope.sideNav = {
                isOpen: false
            };
            $scope.fab = {
                isOpen: false
            };

            $scope.showError = function () {
                $mdToast.show($mdToast.simple().textContent('Sorry. Try Again :-('));
            };

            $scope.showLoading = function () {
                $scope.isLoading = true;
            };

            $scope.hideLoading = function () {
                $scope.isLoading = false;
            };


            $scope.onTabSelected = function (tab) {
                console.log('tab selected: %s', tab);
                $scope.$broadcast('tabSelected', tab);
            };

            $scope.toggleMenu = function ($mdOpenMenu, ev) {
                $mdOpenMenu(ev);
            };

            $scope.refreshApp = function () {
                $scope.$broadcast('refreshApp');
            };
        }])
});

