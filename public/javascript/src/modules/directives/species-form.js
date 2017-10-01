var angular = require('angular');
var ngApp = require('ngApp');
var _ = require('lodash');

var Species = require('core/lib/species');

console.log('loading speciesForm');

module.exports = ngApp.directive('speciesForm', function () {
    return {
        restrict: 'C',
        template: require('raw-loader!./templates/species-form.html'),
        controller: function ($scope, $routeParams, $location, $mdDialog, $controller, request, speciesDataService, userService, uiService) {
            $scope.valTypes = ['string', 'date', 'number', 'boolean'];
            $scope.speciesName = $routeParams.speciesName;
            $scope.speciesProps = [];

            $scope.deleteSpecies = function () {
                return speciesDataService.deleteSpecies($scope.speciesName)
                    .then(function () {
                        $location.path('/species');
                    })
            }

            $scope.updatePlaceholder = function () {
                return $scope.uploadPhoto();
            }

            /**
             *
             * @return {Promise}
             */
            $scope.onDragDrop = function () {
                console.log('dragdrog: %o', arguments);

                _.forEach($scope.speciesProps, function (propData, index) {
                    userService.setUserAnimalPropertyOrder(propData.key, index);
                });

                return userService.saveCurrentUser()
                    .then(function () {
                        return uiService.showMessage('Saved order');
                    })
            };

            $scope.onFileMediaChange = function (evt, $inputs) {
                $scope.saveSpeciesPlaceholder($scope.speciesName, $inputs[0]);
            };

            /**
             *
             * @param {String} speciesName
             * @param {HTMLElement} fileInput
             * @param {Object} [options]
             * @return {Promise}
             */
            $scope.saveSpeciesPlaceholder = function (speciesName, fileInput, options) {
                var opts = _.defaults(options, {});

                return speciesDataService.saveSpeciesPlaceholder($scope.speciesName, fileInput, opts)
                    .then(function (result) {
                        uiService.showMessage("Saved placeholder");
                        return Promise.resolve(result);
                    })
                    .catch(function (err) {
                        console.error(err);
                        uiService.showError('Could not save placeholder image');
                        return Promise.reject(err);
                    })
            };

            /**
             *
             * @param {Object} propData
             * @return {Promise}
             */
            $scope.deleteProp = function (propData, options) {
                console.log('deleting %s', propData.key);
                var confirmationDialog = $mdDialog.confirm()
                    .title("Delete Confirmation")
                    .textContent("Delete '" + propData.key + "'?")
                    .ok('Yes')
                    .cancel('No');

                return $mdDialog.show(confirmationDialog)
                    .then(function onConfirm() {
                        return speciesDataService.deleteSpeciesProp($scope.speciesName, propData.key)
                    })
                    .catch(function onCancel(err) {
                        console.log('cancelled');
                    })
                    .then(function () {
                        return $scope.updateForm();
                    })
                    .then(function () {
                        return uiService.showMessage("Deleted '" + propData.key + "'")
                    })
            };

            /**
             *
             * @param evt
             * @return {Promise}
             */
            $scope.createNewProp = function (evt) {
                var newPropDialogConfig = {
                    template: require('raw-loader!modules/views/dialogs/new-species-prop.html'),
                    targetEvent: evt,
                    clickOutsideToClose: true,
                    controller: ['$scope', '$mdDialog', function ($scope, $mdDialog) {
                        console.log('init $mdDialog w/ $scope', $scope);
                        $scope.save = function () {
                            $mdDialog.hide(_.camelCase($scope.propName));
                        };

                        $scope.hide = function () {
                            $mdDialog.cancel();
                        }
                    }]
                };
                var propName;

                return $mdDialog.show(newPropDialogConfig)
                    .catch(function onCancel(err) {
                        console.log('cancelled: %o', arguments);
                    })
                    .then(function onConfirm(newPropName) {
                        propName = newPropName;
                        console.log('confirmed: %o', arguments);
                        return speciesDataService.createSpeciesProp($scope.speciesName, propName);
                    })
                    .then(function () {
                        $location.path('/species/' + $scope.speciesName + '/property/' + propName);
                        return Promise.resolve();
                    });

            };


            $scope.isEditableProp = function (propData) {
                var unchangeables = {
                    keys: [],
                    valTypes: []
                };

                if (_.includes(unchangeables.keys, propData.key) || _.includes(unchangeables.valTypes, propData.valType)) {
                    return false;
                }

                return true;
            };

            $scope.isVisibleProp = function (propData) {
                var invisibles = {
                    keys: [
                        'petId',
                        'species'
                    ],
                    valTypes: [
                        '[image]',
                        'location'
                    ]
                };

                if (_.includes(invisibles.keys, propData.key) || _.includes(invisibles.valTypes, propData.valType)) {
                    return false;
                }

                return true;
            };

            $scope.updateForm = function () {
                return speciesDataService.getSpecies($scope.speciesName, { useCache: true })
                    .then(function (species) {
                        var activeSpecies = species;
                        var defaultPropPriorities = {
                            // default sort order
                            petId: 0,
                            images: 1,
                            petName: 2,
                            species: 3
                        };
                        var propPriorities = _.reduce(userService.getUserAnimalPropertiesOrder(), function (collection, propOrderVal, propName) {
                            switch (propName) {
                                case 'petId':
                                case 'images':
                                case 'petName':
                                case 'species':
                                    // avoid overwriting these these values because we always want them at the top
                                    break;
                                default:
                                    // +4 to start after species
                                    collection[propName] = propOrderVal + 4;
                            }
                            return collection;
                        }, defaultPropPriorities);

                        $scope.speciesProps = _.sortBy(activeSpecies.getProps(), function (propData) {
                            // default to prop order in not specified
                            return propPriorities[propData.key] ? propPriorities[propData.key] : 9999;
                        });

                    })
            };

            (function init() {
                $scope.updateForm()
                    .catch(function (err) {
                        console.error(err);
                        uiService.showError("Could not load '" + $scope.speciesName + "'")
                    })
            })()

        }
    }
});
