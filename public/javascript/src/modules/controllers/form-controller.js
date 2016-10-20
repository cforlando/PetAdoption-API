define([
    'require',
    'underscore',
    'async',
    'ngApp'
], function (require) {
    var ngApp = require('ngApp'),
        async = require('async'),
        _ = require('underscore');

    return ngApp.controller('formController', [
        '$scope', 'request', '$mdToast', '$mdDialog', 'dataParserService', '$routeParams', '$location',
        function ($scope, request, $mdToast, $mdDialog, dataParserService, $routeParams, $location) {
            $scope.getSelectOptionLabel = function (option){
                if(option === true){
                    return 'Yes';
                } else if(option === false){
                    return 'No'
                } else {
                    return option;
                }

            };

            $scope.isSelectInput = function (propData) {
                if (!propData) return false;
                switch (propData.key) {
                    case 'species':
                        return true;
                        break;
                    default:
                        break;
                }
                return false;
            };

            $scope.isBooleanInput = function (propData) {
                if (!propData) return false;
                switch (propData.key) {
                    default:
                        break;
                }
                return (propData.valType == "Boolean")
            };


            $scope.isDateField = function (propData) {
                return (propData && propData.valType == "Date")
            };

            $scope.isImagesField = function (propData) {
                return (propData && propData.valType == "[Image]")
            };

            $scope.isLocationField = function (propData) {
                return (propData && propData.valType == "Location")
            };

            $scope.isParagraphField = function (propData) {
                return (propData && propData.key == "description")
            };

            $scope.isNumberField = function (propData) {
                return (propData && propData.valType == "Number")
            };

            $scope.isAutocompleteField = function (propData) {
                if (!propData) return false;
                switch (propData.key) {
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
