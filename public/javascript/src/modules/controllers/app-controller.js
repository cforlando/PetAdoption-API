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
                if($scope.loadingQueue.length > 0) $scope.loadingQueue.length--;
            };


            $scope.onTabSelected = function (tab) {
                console.log('tab selected: %s', tab);
                $scope.$broadcast('change:tab', tab);
            };

            $scope.toggleMenu = function ($mdOpenMenu, ev) {
                $mdOpenMenu(ev);
            };

            $scope.toggleFAB = function(){
                $scope.fab.isOpen = !$scope.fab.isOpen;
            };

            $scope.toggleSidebar = function(){
                $scope.sideNav.isOpen = !$scope.sideNav.isOpen;
            };

            $scope.refreshApp = function () {
                $scope.$broadcast('reload:app');
            };

            $scope.isSelectInput = function(propData){
                if (!propData) return false;
                switch(propData.key){
                    case 'species':
                        return true;
                        break;
                    default:
                        return (propData.valType == "Boolean")
                }
            };

            $scope.isDateField = function(propData){
                return (propData && propData.valType == "Date")
            };

            $scope.isImagesField = function(propData){
                return (propData && propData.valType == "[Image]")
            };

            $scope.isLocationField = function(propData){
                return (propData && propData.valType == "Location")
            };

            $scope.isParagraphField = function(propData){
                return (propData && propData.key == "description")
            };

            $scope.isAutocompleteField = function(propData){
                if (!propData) return false;
                switch(propData.key){
                    case 'petId':
                    case 'description':
                    case 'species':
                        return false;
                        break;
                    default:
                        return (propData.valType == "String")
                }
            };
        }])
});

