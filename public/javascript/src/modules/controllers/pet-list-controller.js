define([
    'require',
    'underscore',
    'modules/controllers/batch-data-controller',
    'text!modules/views/dialogs/batch-edit.html',
    'ngApp'
], function (require) {
    var ngApp = require('ngApp'),
        _ = require('underscore');
    ngApp.controller('petListController', [
        '$scope', '$mdDialog', '$controller',
        function ($scope, $mdDialog, $controller) {
            angular.extend(this, $controller('batchDataController', {$scope: $scope}));
            $scope.selectedPetsDataCollection = {};
            $scope.selectedPetsIndexCollection = {};
            $scope.batchFormScopes = {
                registered: []
            };

            $scope.hideDialog = function () {
                $scope.$broadcast('dialog:hide');
            };

            $scope.getActiveSpecies = function () {
                var defaultSpecies = 'dog',
                    species = false;
                _.forEach($scope.selectedPetsIndexCollection, function (petData, petIndex) {
                    if (petData && petData.species) {
                        species = petData.species.val;
                        return false;
                    }
                });
                species = (!species && $scope.speciesList) ? $scope.speciesList[$scope.petList.currentSpeciesIndex] : species;
                return (species || defaultSpecies).toLowerCase();
            };

            $scope.isBatchEditActive = function () {
                return (_.keys($scope.selectedPetsDataCollection).length > 0);
            };

            $scope.updatePetSelection = function (petIndexID, petData) {
                if ($scope.selectedPetsDataCollection[petIndexID]) {
                    delete $scope.selectedPetsDataCollection[petIndexID];
                } else {
                    $scope.selectedPetsDataCollection[petIndexID] = petData;
                }
            };

            $scope.clearSelectedPets = function () {

                _.forEach($scope.selectedPetsIndexCollection, function (val, index) {
                    $scope.selectedPetsIndexCollection[index] = false;
                });

                _.forEach($scope.selectedPetsDataCollection, function (val, index) {
                    delete $scope.selectedPetsDataCollection[index];
                });
            };

            $scope.batchEdit = function (ev) {
                $mdDialog.show({
                    controller: function ($scope, $mdDialog) {
                        var hideListenerRemover = $scope.$on('dialog:hide', function () {
                            console.log('petList: mdDialog: closing dialog');
                            $mdDialog.hide();
                            hideListenerRemover();
                        })
                    },
                    template: require('text!modules/views/dialogs/batch-edit.html'),
                    parent: angular.element(document.body),
                    targetEvent: ev,
                    scope: $scope,
                    preserveScope: true,
                    clickOutsideToClose: true
                })
            };

            $scope.registerForm = function ($formScope) {
                $scope.batchFormScopes.registered.push($formScope);
                $scope.getSpeciesList(function () {
                    _.forEach($scope.batchFormScopes.registered, function ($formScope) {
                        // we init the species. the form will request to update via getModel
                        $formScope.setPet({
                            species: _.defaults($formScope.petData.species, {
                                val: $scope.getActiveSpecies(),
                                key: 'species',
                                options: $scope.speciesList
                            })
                        }, {
                            reset: true
                        });
                    });
                });
            };

            console.log('petBatchDataController($scope = %o)', $scope);
        }]);
});