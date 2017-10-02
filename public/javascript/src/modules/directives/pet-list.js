var ngApp = require('ngApp');
var _ = require('lodash');

module.exports = ngApp.directive('petList', function () {
    return {
        restrict: 'EC',
        template: require('raw-loader!./templates/pet-list.html'),
        scope: {
            onPetChange: '='
        },
        controller: function ($scope, $mdDialog, animalDataService, speciesDataService, uiService) {
            $scope.currentSpeciesIndex = 0;
            $scope.animals = {};
            $scope.selectedPets = {};
            $scope.selectedSpecies = null;
            $scope.batchSpeciesProp = null;

            $scope.getActiveSpecies = function () {
                var defaultSpecies = 'dog';
                var speciesName = false;

                _.forEach($scope.selectedPets, function (animal) {
                    speciesName = animal.getSpeciesName();
                    if (speciesName) {
                        // if we have a species, exit early
                        return false;
                    }
                });

                // use selected tab species in pet list as fallback
                if (!speciesName && $scope.selectedSpecies) {
                    speciesName = $scope.selectedSpecies;
                }

                return (speciesName || defaultSpecies).toLowerCase();
            };

            $scope.isBatchEditActive = function () {
                return (_.keys($scope.selectedPets).length > 0);
            };

            /**
             *
             * @param {Animal} animal
             */
            $scope.selectPet = function (animal) {
                $scope.selectedPets[animal.getId()] = animal;
            };

            /**
             *
             * @param {Animal} animal
             */
            $scope.editPet = function (animal) {
                $scope.onPetChange(animal);
            };

            /**
             *
             * @param {Animal} animal
             */
            $scope.deselectPet = function (animal) {
                delete $scope.selectedPets[animal.getId()];
            };

            /**
             *
             * @param {Animal} animal
             */
            $scope.togglePetSelection = function (animal) {
                var animalId = animal.getId();

                $scope.selectedPets[animalId] ? $scope.deselectPet(animal) : $scope.selectPet(animal);
            };

            $scope.clearSelectedPets = function () {
                _.forEach($scope.selectedPets, function (animal) {
                    $scope.deselectPet(animal);
                });
            };

            $scope.isEditableByBatch = function (propData) {
                switch (propData.key) {
                    case 'petName':
                        return false;
                    default:
                        break;
                }
                switch (propData.valType) {
                    case 'string':
                    case 'number':
                    case 'boolean':
                    case 'date':
                        return true;
                    default:
                        return false;
                }
            };

            $scope.setBatchSpecies = function (speciesName) {
                return speciesDataService.getSpecies(speciesName, {useCache: true})
                    .then(function (species) {
                        $scope.batchProperties = species.getProps().filter($scope.isEditableByBatch);
                        $scope.batchSpeciesProp = _.chain($scope.batchProperties)
                            .find({key: 'species'})
                            .extend({
                                val: speciesName,
                                options: $scope.speciesList
                            })
                            .value();
                    })
                    .catch(function (err) {
                        uiService.showError('Could not get model for ' + speciesName);
                        console.error(err);
                    })
            };

            $scope.batchEdit = function (ev) {
                var speciesWatchHandler = $scope.$watch('batchSpeciesProp.val', function (activeSpeciesName) {
                    if (!activeSpeciesName) {
                        // ignore invalid speciesName value
                        return;
                    }
                    $scope.setBatchSpecies(activeSpeciesName);
                });

                $scope.setBatchSpecies($scope.getActiveSpecies());

                $mdDialog.show({
                        controller: function ($mdDialog) {
                            $scope.close = function () {
                                console.log('petList: mdDialog: closing dialog');
                                $mdDialog.hide();
                            }
                        },
                        template: require('raw-loader!modules/views/dialogs/batch-edit.html'),
                        parent: angular.element(document.body),
                        targetEvent: ev,
                        scope: $scope,
                        preserveScope: true,
                        clickOutsideToClose: true
                    })
                    .catch(function (err) {
                        console.error(err);
                    })
                    .then(function () {
                        speciesWatchHandler();
                    })
            };

            $scope.isEditableProp = function (propData) {
                switch (propData.key) {
                    case 'petName':
                        return false;
                    default:
                        break;
                }
                switch (propData.valType) {
                    case 'string':
                    case 'number':
                    case 'boolean':
                    case 'date':
                        return true;
                    default:
                        return false;
                }
            };


            function loadPets() {
                return speciesDataService.getSpeciesList()
                    .then(function (speciesList) {
                        $scope.speciesList = speciesList;
                        return Promise.all(speciesList.map(function (speciesName) {
                            return animalDataService.getAnimalsBySpecies(speciesName)
                                .then(function (animals) {
                                    $scope.animals[speciesName] = animals;
                                })
                        }))
                    })
            }

            /**
             *
             * @param {Object} [options]
             * @param {String} [options.visibleNotification=true]
             */
            $scope.save = function (options) {
                var opts = _.defaults(options, {
                    visibleNotification: true
                });

                return Promise.all(Object.keys($scope.selectedPets).map(function (animalId, idx) {
                        var animal = $scope.selectedPets[animalId];

                        if (!animal) {
                            console.error('Could not save pet[%s]: %o', idx, animal);
                            return Promise.resolve();
                        }

                        return animalDataService.fetchAnimal(animal)
                            .then(function (fetchedAnimal) {

                                fetchedAnimal.setProps($scope.batchProperties);

                                return animalDataService.saveAnimal(fetchedAnimal)
                                    .then(function (result) {
                                        console.log('petList: saved pet (%s/%s)', idx, Object.keys($scope.selectedPets).length);
                                        return result;
                                    })
                            })
                            .catch(function (err) {
                                if (opts.visibleNotification) uiService.showError('Could not save pet');
                                console.error(err);
                            })
                    }))
                    .then(function () {
                        if (opts.visibleNotification) uiService.showMessage('All pets saved');
                    })
                    .catch(function (err) {
                        console.error(err);
                        if (opts.visibleNotification) uiService.showError('Failed to save all pets');
                    })
                    .then(function () {
                        loadPets();
                    })
            };


            $scope.delete = function (options) {
                return Promise.all(Object.keys($scope.selectedPets).map(function (selectedPetId) {
                        return animalDataService.deleteAnimal($scope.selectedPets[selectedPetId])
                    }))
                    .then(function () {
                        if ($scope.visibleNotification) uiService.showMessage('All pets deleted');
                    })
                    .catch(function (err) {
                        console.error(err);
                        if ($scope.visibleNotification) uiService.showError('Could not delete all pets');
                    })
                    .then(function () {
                        loadPets()
                    })
            };

            (function init() {
                loadPets();
            })();
        }
    }
});

module.exports = ngApp;
