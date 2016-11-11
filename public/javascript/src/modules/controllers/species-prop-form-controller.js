define([
    'require',
    'angular',
    'underscore',
    'moment',
    'modules/controllers/form-controller',
    'text!modules/views/dialogs/new-species-prop.html',
    'ngApp'
], function (require) {
    var angular = require('angular'),
        ngApp = require('ngApp'),
        moment = require('moment'),
        _ = require('underscore');

    return ngApp.controller("speciesPropFormController", [
        '$scope', '$routeParams', '$location', '$mdDialog', '$controller',
        function ($scope, $routeParams, $location, $mdDialog, $controller) {
            angular.extend(this, $controller('formController', {$scope: $scope}));
            $scope.propName = $routeParams.propName;

            $scope.setField = function (key, propData) {
                // in this instance, set the default value
                switch (propData.valType) {
                    default:
                        var speciesProp = $scope.getSpeciesProp(key, $scope.models[$scope.speciesName]);
                        speciesProp.defaultVal = angular.copy(propData.val);

                        $scope.setSpeciesProp($scope.speciesName, speciesProp);
                }
            };

            $scope.readPropData = function () {
                var $speciesProp = $scope.getSpeciesProp($scope.speciesName, $scope.propName);
                if ($speciesProp) {
                    $scope.propData = angular.copy($speciesProp);
                } else {
                    // $scope.showError("Property not valid");
                    $location.path('/species/'+$scope.speciesName);
                    console.error('invalid propName')
                }
            };

            $scope.createOption = function (key, option) {
                $scope.propData.options = _.uniq([option].concat($scope.propData.options));
            };


            $scope.isFormValid = function () {
                return angular.element('.section--edit-propData .input .md-input-invalid').length == 0;
            };

            $scope.hasEditableOptions = function(propData){
                if (!propData)  return false
                switch ($scope.getPropType(propData)){
                    case 'string':
                    case 'number':
                        return true;
                    default:
                        return false;
                }
            }

            $scope.saveProp = function (propData) {
                if ($scope.isFormValid()) {
                    if (propData.val) {
                        propData.defaultVal = angular.copy(propData.val);
                    }

                    switch (propData.valType) {
                        case 'Date':
                        case 'Number':
                            propData.options = [];
                            break;
                        case 'Boolean':
                            propData.options = [true, false];
                            break;
                        default:
                            break;
                    }

                    delete propData.val;
                    $scope.setSpeciesProp($scope.speciesName, propData);

                    $scope.saveSpecies($scope.speciesName, $scope.models[$scope.speciesName], {
                        done: function (err) {
                            if (err) {
                                $scope.showError("Failed to save property");
                            } else {
                                $scope.showError("Saved '" + propData.key + "'");
                            }
                        }
                    })
                } else {
                    $scope.showError("Form is invalid. Please fix.");
                }
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
                        if (!_.isNumber($scope.propData.defaultVal)){
                            $scope.propData.defaultVal = 0;
                        };
                        break;
                    case 'Boolean':
                        if (!_.isBoolean($scope.propData.defaultVal)){
                            $scope.propData.defaultVal = true;
                        };
                        break;
                    case 'String':
                    default:
                        if (!_.isString($scope.propData.defaultVal)){
                            $scope.propData.defaultVal = '';
                        };
                }
            };


            function setTypeWatcher() {

                var typeWatchHandler = $scope.$watch("propData.valType", function (valType) {
                    $scope.formatDataByType(valType);
                });

                var destroyWatchHander = $scope.$on('$destroy', function () {
                    typeWatchHandler();
                    destroyWatchHander();
                })
            }


            function init() {
                if ($scope.models[$scope.speciesName]) {
                    $scope.readPropData();
                    setTypeWatcher();
                } else {
                    var speciesDataWatchHandler = $scope.$watch('models.' + $scope.speciesName, function (speciesData) {
                        if (speciesData) {
                            speciesDataWatchHandler();
                            $scope.readPropData();
                            setTypeWatcher();
                        }
                    });
                }
            }

            init();


        }])
});
