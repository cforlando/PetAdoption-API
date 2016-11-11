define([
    'require',
    'angular',
    'underscore',
    'ngApp'
], function (require) {
    var ngApp = require('ngApp'),
        _ = require('underscore'),
        angular = require('angular');

    console.log('loading app controller w/ %o', ngApp);

    return ngApp.controller('appController', [
        '$scope', 'request', '$mdToast', '$location',
        function ($scope, request, $mdToast, $location) {
            console.log('init app controller');
            angular.element('.loading-text').remove();
            $scope.loadingQueue = {
                length: 0
            };

            $scope.sideNav = {
                isOpen: false
            };

            $scope.defaultActions = [
                {
                    onClick: function () {
                        console.log('click')
                    },
                    icon: 'code',
                    label: 'no-op'
                }
            ];
            $scope.actionMenu = {
                actions: $scope.defaultActions
            };

            $scope.login = function () {
                location.href = '/auth/google';
            };

            /**
             *
             * @param {String} errorMessage
             */
            $scope.showError = function (errorMessage) {
                $mdToast.show($mdToast.simple().textContent(errorMessage || 'Sorry. Try Again :-('));
            };
            /**
             *
             * @param {String} message
             */
            $scope.showMessage = function (message) {
                $mdToast.show($mdToast.simple().textContent(message || 'Success'));
            };

            $scope.showLoading = function () {
                $scope.loadingQueue.length++;
            };

            $scope.hideLoading = function () {
                if ($scope.loadingQueue.length > 0) $scope.loadingQueue.length--;
            };

            $scope.showAnimalSearch = function () {
                $location.path('/animals/');
                $scope.closeSidebar();
            };

            $scope.showAnimalEditForm = function () {
                $location.path('/animals/new');
                $scope.closeSidebar();
            };

            $scope.showSpeciesSearch = function () {
                $location.path('/species');
                $scope.closeSidebar();
            };

            $scope.showSpecies = function (speciesName) {
                $location.path('/species/' + speciesName);
                $scope.closeSidebar();
            };

            $scope.onTabSelected = function (tab) {
                console.log('tab selected: %s', tab);
                $scope.$broadcast('change:tab', tab);
            };

            $scope.toggleMenu = function ($mdOpenMenu, ev) {
                $mdOpenMenu(ev);
            };

            $scope.toggleSidebar = function () {
                $scope.sideNav.isOpen = !$scope.sideNav.isOpen;
            };

            $scope.closeSidebar = function () {
                $scope.sideNav.isOpen = false;
            };

            $scope.refreshApp = function () {
                $scope.$broadcast('reload:app');
            };


            $scope.toggleActionMenu = function () {
                console.log('$scope.$broadcast(toggle:action-menu)');
                $scope.$broadcast('toggle:action-menu');
            };

            /**
             *
             * @param actions
             */
            $scope.registerMenuActions = function (actions) {
                $scope.actionMenu.actions = actions;
            };

            $scope.$on('$locationChangeSuccess', function () {
                $scope.registerMenuActions($scope.defaultActions)
            });

        }
    ])
});
