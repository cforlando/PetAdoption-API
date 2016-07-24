define([
    'require',
    'underscore',
    'ngApp'
], function (require) {
    var ngApp = require('ngApp'),
        _ = require('underscore');

    return ngApp.controller('appController', ['$scope', '$http', '$mdToast',
        function ($scope, $http, $mdToast) {
            $scope.loadingQueue = {
                length : 0
            };
            angular.element('.loading-text').remove();
            $scope.sideNav = {
                isOpen: false
            };
            $scope.fab = {
                isOpen: false
            };
            $scope.showError = function (errorMessage) {
                $mdToast.show($mdToast.simple().textContent(errorMessage || 'Sorry. Try Again :-('));
            };

            $scope.showLoading = function () {
                $scope.loadingQueue.length++;
            };

            $scope.hideLoading = function () {
                if($scope.loadingQueue.length > 0) $scope.loadingQueue.length--;
            };


            $scope.onTabSelected = function (tab) {
                console.log('tab selected: %s', tab);
                $scope.$broadcast('change:tab', tab);
            };

            $scope.toggleMenu = function ($mdOpenMenu, ev) {
                $mdOpenMenu(ev);
            };

            $scope.refreshApp = function () {
                $scope.$broadcast('reload:app');
            };
        }])
});

