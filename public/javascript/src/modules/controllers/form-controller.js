var ngApp = require('ngApp');
var _ = require('lodash');

ngApp.controller('formController', [
    '$scope',
    function ($scope) {

        $scope.getPropType = function (propData) {
            if (!propData) return 'invalid';

            switch (propData.key) {
                case 'petId':
                    return 'hidden';
                case 'species':
                    return 'select';
                case 'description':
                    return 'textarea';
                default:
                    break;
            }

            switch (propData.valType) {
                case 'Location':
                    return 'location';
                case '[Image]':
                    return 'gallery';
                case 'Date':
                    return 'date';
                case 'Number':
                    return 'number';
                case 'Boolean':
                    return 'boolean';
                default:
                    return 'string';
            }
        };

        $scope.isPropResetable = function (propData) {
            switch (propData.valType) {
                case 'String':
                case 'Number':
                case 'Date':
                    return true;
                default:
                    return false;
            }
        };

        $scope.getSelectOptionLabel = function (option) {
            if (option === true) {
                return 'Yes';
            } else if (option === false) {
                return 'No'
            } else {
                return option;
            }

        };

    }])

module.exports = ngApp;
