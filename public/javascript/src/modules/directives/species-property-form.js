var angular = require('angular');
var ngApp = require('ngApp');
var moment = require('moment');
var _ = require('lodash');

ngApp.directive('speciesPropForm', function () {
    return {
        restrict: 'C',
        template: require('raw-loader!./templates/species-property-form.html'),
        controller: function ($scope, $routeParams, $location, $mdDialog, $controller, speciesDataService, userService, uiService, animalDataService) {
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

                switch (animalDataService.getPropType($scope.propData)) {
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

                    uiService.showError(formErrMessage);

                    return Promise.reject(new Error(formErrMessage));
                }

                if ($scope.propOrderValue) {
                    userService.saveUserAnimalPropertyOrder($scope.propData.key, $scope.propOrderValue);
                }

                if ($scope.propData.val) {
                    $scope.propData.defaultVal = angular.copy($scope.propData.val);
                }

                $scope.formatDefaultVal();

                switch ($scope.propData.valType) {
                    case 'date':
                    case 'number':
                        $scope.propData.options = [];
                        break;
                    case 'boolean':
                        $scope.propData.options = [true, false];
                        break;
                    default:
                        break;
                }

                return speciesDataService.saveSpeciesProp($scope.speciesName, _.omit($scope.propData, 'val'))
                    .then(function(){
                        uiService.showMessage("Successfully saved property");
                    })
                    .catch(function (err) {
                        uiService.showError("Failed to save property");
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
             * @param {String} [defaultValType]
             */
            $scope.formatDefaultVal = function (defaultValType) {
                var propType = defaultValType || $scope.propData.valType;
                console.log('setting prop type to %s', propType);
                switch (propType) {
                    case 'date':
                        $scope.propData.defaultVal = moment.utc($scope.propData.defaultVal).toDate();
                        break;
                    case 'number':
                        if (!_.isNumber($scope.propData.defaultVal)) {
                            $scope.propData.defaultVal = parseFloat($scope.propData.defaultVal) || 0;
                        }
                        break;
                    case 'boolean':
                        if (!_.isBoolean($scope.propData.defaultVal)) {
                            $scope.propData.defaultVal = true;
                        }
                        break;
                    case 'string':
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
                        }, ['number', 'string', 'date', 'boolean']);

                        if (!$scope.activeSpecies.getProp($scope.propName)) {
                            uiService.showError("Property not valid");
                            console.error('invalid propName');
                            $location.path('/species/' + $scope.speciesName);
                        }

                        propTypeWatchHandler = $scope.$watch("propData.valType", function (valType) {
                            $scope.formatDefaultVal(valType);
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
