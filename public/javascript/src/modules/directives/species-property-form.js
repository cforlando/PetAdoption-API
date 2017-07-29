var angular = require('angular');
var ngApp = require('ngApp');
var moment = require('moment');
var _ = require('lodash');

ngApp.directive('speciesPropForm', function () {
    return {
        restrict: 'C',
        template: require('raw!./templates/species-property-form.html'),
        controller: function ($scope, $routeParams, $location, $mdDialog, $controller, speciesDataService, userService) {
            angular.extend(this, $controller('formController', {$scope: $scope}));

            $scope.speciesName = $routeParams.speciesName;
            $scope.propName = $routeParams.propName;
            $scope.propOrderValue = userService.getPropPriority($scope.propName);

            $scope.addSpeciesPropertyOption = function (key, option) {
                $scope.propData.options = _.uniq([option].concat($scope.propData.options));
            };

            $scope.isFormValid = function () {
                return angular.element('.section--edit-propData .md-input-invalid').length === 0;
            };

            $scope.hasEditableOptions = function () {
                if (!$scope.propData) {
                    console.warn('$scope.hasEditableOptions called without valid propData');
                    return false;
                }

                switch ($scope.getPropType($scope.propData)) {
                    case 'string':
                    case 'number':
                        return true;
                    default:
                        return false;
                }
            };

            /**
             *
             * @returns {Promise}
             */
            $scope.saveSpeciesProperty = function () {

                if (!$scope.isFormValid()) {
                    var formErrMessage = "Form is invalid. Please fix.";

                    $scope.showError(formErrMessage);

                    return Promise.reject(new Error(formErrMessage));
                }

                if ($scope.propOrderValue) {
                    userService.saveUserAnimalPropertyOrder($scope.propData.key, $scope.propOrderValue);
                }

                if ($scope.propData.val) {
                    $scope.propData.defaultVal = angular.copy($scope.propData.val);
                }

                switch ($scope.propData.valType) {
                    case 'Date':
                    case 'Number':
                        $scope.propData.options = [];
                        break;
                    case 'Boolean':
                        $scope.propData.options = [true, false];
                        break;
                    default:
                        break;
                }

                $scope.showLoading();
                return speciesDataService.saveSpeciesProp($scope.speciesName, _.omit($scope.propData, 'val'))
                    .then(function(){
                        $scope.hideLoading();
                        $scope.showMessage("Successfully saved property");
                    })
                    .catch(function (err) {
                        $scope.hideLoading();
                        $scope.showError("Failed to save property");
                        console.error(err);
                        return Promise.reject(err);
                    })
            };

            /**
             *
             * @returns {Promise}
             */
            $scope.deleteSpeciesProperty = function () {
                return speciesDataService.deleteSpeciesProp($scope.speciesName, $scope.propName);
            };


            /**
             *
             * @param {String} propType
             */
            $scope.formatDataByType = function (propType) {
                console.log('setting prop type to %s', propType);
                switch (propType) {
                    case 'Date':
                        $scope.propData.defaultVal = moment.utc($scope.propData.defaultVal).toDate();
                        break;
                    case 'Number':
                        if (!_.isNumber($scope.propData.defaultVal)) {
                            $scope.propData.defaultVal = 0;
                        }
                        break;
                    case 'Boolean':
                        if (!_.isBoolean($scope.propData.defaultVal)) {
                            $scope.propData.defaultVal = true;
                        }
                        break;
                    case 'String':
                    default:
                        if (!_.isString($scope.propData.defaultVal)) {
                            $scope.propData.defaultVal = '';
                        }
                }
            };

            (function init() {
                var propTypeWatchHandler;
                var destroyWatchHandler;

                speciesDataService.getSpecies($scope.speciesName)
                    .then(function(species){
                        $scope.activeSpecies = species;
                        $scope.propData = speciesDataService.getSpeciesProp($scope.speciesName, $scope.propName);
                        $scope.valTypes = _.reduce($scope.activeSpecies.getSpeciesProps(), function(valTypes, speciesProp){
                            if (valTypes.indexOf(speciesProp.valType) < 0){
                                valTypes.push(speciesProp.valType);
                            }
                            return valTypes;
                        }, ['Number', 'String', 'Date', 'Boolean']);

                        if (!$scope.activeSpecies.getProp($scope.propName)) {
                            $scope.showError("Property not valid");
                            console.error('invalid propName');
                            $location.path('/species/' + $scope.speciesName);
                        }

                        propTypeWatchHandler = $scope.$watch("propData.valType", function (valType) {
                            $scope.formatDataByType(valType);
                        });

                        destroyWatchHandler = $scope.$on('$destroy', function () {
                            propTypeWatchHandler();
                            destroyWatchHandler();
                        });
                    });
            })()
        }
    }
});

module.exports = ngApp;
