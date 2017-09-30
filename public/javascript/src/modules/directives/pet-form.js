var angular = require('angular');
var ngApp = require('ngApp');
var _ = require('lodash');

var Animal = require('core/lib/animal');
var Species = require('core/lib/species');

console.log('loading petFormController');

module.exports = ngApp.directive('petForm', function () {
    return {
        restrict: 'C',
        template: require('raw-loader!./templates/pet-form.html'),
        controller: function ($scope, $element, $mdDialog, $routeParams, $controller, speciesFactory, addressFinderService, animalDataService, speciesDataService, userService) {
            console.log('init petForm.controller');
            angular.extend(this, $controller('formController', {$scope: $scope}));

            /**
             *
             * @type {Animal}
             */
            $scope.activeAnimal = null;

            $scope.fab = {
                isOpen: false
            };

            $scope.toggleFAB = function () {
                $scope.fab.isOpen = !$scope.fab.isOpen;
            };

            /**
             *
             * @param {Animal} [animal]
             */
            $scope.render = function (animal) {
                var activeAnimal = animal || $scope.activeAnimal;


                if (!activeAnimal) {
                    // no-op
                    return Promise.resolve();
                }

                var propPriorities = _.reduce(userService.getUserAnimalPropertiesOrder(), function (collection, propOrderVal, propName) {
                    // +4 to start after species
                    switch (propName) {
                        case 'petId':
                        case 'images':
                        case 'petName':
                        case 'species':
                            // avoid overwritting these override these values
                            break;
                        default:
                            collection[propName] = propOrderVal + 4;
                    }
                    return collection;
                }, {
                    // default sort order
                    petId: 0,
                    images: 1,
                    petName: 2,
                    species: 3
                });

                console.log('rendering with priorities: %j', propPriorities);

                $scope.formRenderData = _.chain(activeAnimal.getProps())
                    .reduce(function (collection, prop) {
                        if (prop.key.match(/Lat|Lon/)) {
                            // ignore location properties for now
                            return collection;
                        }

                        collection.push(prop);
                        return collection;
                    }, [])
                    .sortBy(function (propData) {
                        // default to prop order in not specified
                        return propPriorities[propData.key] ? propPriorities[propData.key] : 9999;
                    })
                    .value();

                console.log('rendering: %o', $scope.formRenderData);
                return Promise.resolve($scope.formRenderData);
            };

            function buildShelterAddress() {
                var shelterLocationProperties = ['shelterAddrLine1', 'shelterAddrLine2', 'shelterAddrCity', 'shelterAddrSt', 'shelterAddrZip'],
                    shelterLocationValues = shelterLocationProperties.map(function (propName, index) {
                        return $scope.activeAnimal.getValue(propName);
                    });

                return shelterLocationValues.join(' ');
            }

            /**
             *
             * @return {Promise}
             */
            $scope.syncShelterAddressMap = function () {
                var shelterAddress = buildShelterAddress();

                return addressFinderService.findCoordinates(shelterAddress)
                    .then(function (result) {
                        var confirmDialog = $mdDialog.confirm()
                            .title('Would you like to use this shelter address?')
                            .textContent(result['address'])
                            .ariaLabel('Shelter Address')
                            .ok('Yes')
                            .cancel('No');

                        console.log('shelterAddressChange() = %o', result);

                        return $mdDialog.show(confirmDialog)
                            .then(function onAccept() {
                                console.log('shelterAddressChange() - shelterGeoLat <- %s | shelterGeoLon <- %s', result['lat'], result['lng']);
                                $scope.activeAnimal.setValue('shelterGeoLat', result['lat']);
                                $scope.activeAnimal.setValue('shelterGeoLon', result['lng']);
                            })
                            .catch(function onDecline() {
                                console.log('cancelled');
                            });
                    })
                    .catch(function (err) {
                        console.error(err);
                    })
            };

            /**
             *
             * @param options
             * @return {Promise}
             */
            $scope.promptSpeciesSelection = function (options) {
                var _options = _.defaults(options, {});
                var $parentScope = $scope;

                return speciesDataService.getSpeciesList()
                    .then(function (speciesList) {

                        var dialogConfiguration = {
                            controller: function ($scope, $mdDialog) {

                                $scope.speciesList = speciesList;
                                $scope.selectSpecies = function (selectedSpecies) {
                                    $mdDialog.hide(selectedSpecies);
                                };

                                var speciesWatchHandler = $parentScope.$watch('getPetSpeciesName()', function (speciesName) {
                                    if (speciesName) {
                                        speciesWatchHandler();
                                        $mdDialog.hide(speciesName);
                                    }
                                });

                                $parentScope.killSpeciesPrompt = function(){
                                    delete $parentScope.killSpeciesPrompt;
                                    speciesWatchHandler();
                                    $mdDialog.cancel();
                                };

                            },
                            template: require('raw-loader!modules/views/dialogs/new-animal.html'),
                            parent: angular.element('.pet--form'),
                            clickOutsideToClose: false,
                            escapeToClose: false
                        };

                        return $mdDialog.show(dialogConfiguration)
                    })
                    .catch(function cancel(err) {
                        console.warn('new animal dialog species selection canceled with: %j', err);
                        return Promise.resolve('dog');
                    });
            };


            /**
             *
             * @param {String} propName
             * @param {Object} propData
             */
            $scope.setAnimalProperty = function (propName, propData) {
                propData.key = propData.key || propName;
                $scope.activeAnimal.setProps([propData]);
            };

            /**
             *
             * @param fieldName
             * @param val
             * @return {Promise}
             */
            $scope.addSpeciesPropertyOption = function (fieldName, val) {
                var speciesProp = $scope.activeAnimal.getProp(fieldName);

                speciesProp.options = _.uniq([val].concat(speciesProp.options));
                $scope.activeAnimal.setProps([speciesProp]);
                console.log('updated %s prop: %o', fieldName, speciesProp);

                return speciesDataService.saveSpecies($scope.activeAnimal)
                    .then(function () {
                        return $scope.reloadPetSpecies({useCache: true})
                    })
                    .then(function () {
                        $scope.render();
                        $scope.showMessage('Created option, "' + val + '", for "' + fieldName + '"');
                    });
            };


            /**
             *
             * @param {String} petId
             * @return {Promise}
             */
            $scope.loadPetById = function (petId) {

                console.log('petForm.loadPetById(%s)', petId);
                $scope.showLoading();

                return animalDataService.fetchAnimalById(petId)
                    .then(function (fetchedAnimal) {
                        if (!fetchedAnimal.getSpeciesName()) {
                            fetchedAnimal.setValue('species', $routeParams.speciesName);
                        }
                        $scope.activeAnimal = fetchedAnimal;
                        $scope.hideLoading();
                        $scope.showMessage('Successfully loaded pet');
                    })
                    .catch(function (err) {

                        console.error(err);
                        $scope.hideLoading();
                        $scope.showError('Could not load pet');

                        return Promise.reject(err);
                    });
            };

            /**
             *
             * @param {Object} [options]
             * @param {Boolean} [options.idOnly]
             */
            $scope.clearPetValues = function (options) {
                var _options = _.defaults(options, {
                    idOnly: false
                });

                if (_options.idOnly === true) {
                    $scope.activeAnimal.setValue('petId', null);
                } else {
                    _.forEach($scope.activeAnimal.toObject(), function (propData, propName) {
                        if (propName !== 'species') {
                            $scope.activeAnimal.setValue(propName, null);
                        }
                    });
                }
            };

            /**
             * removes temporarily uploaded images
             */
            $scope.sanitizePetMediaValues = function () {
                var sanitizedImages = _.filter($scope.activeAnimal.getValue('images'), function (imageURL) {
                    // remove preview data urls
                    return imageURL && !(/^data/.test(imageURL));
                });
                $scope.activeAnimal.setValue('images', sanitizedImages);
            };

            /**
             *
             * @param {Object} [options]
             * @param {Boolean} [options.updatePetList=true]
             * @param {Boolean} [options.syncShelterMap=true]
             * @param {Boolean} [options.visibleNotification=false]
             * @param {Boolean} [options.successRedirect=false]
             * @return {Promise<Animal>}
             */
            $scope.savePet = function (options) {
                var opts = _.defaults(options, {
                    updatePetList: true,
                    syncShelterMap: true,
                    visibleNotification: false,
                    successRedirect: false
                });
                var beforeSave = function () {
                    if (opts.syncShelterMap) {
                        return $scope.syncShelterAddressMap()
                            .catch(function (err) {
                                console.error(err);
                            })
                    }

                    // no-op by default
                    return Promise.resolve();
                };


                return beforeSave()
                    .then(function () {
                        $scope.showLoading();
                        // avoid polluting the form's data
                        $scope.sanitizePetMediaValues();

                        // append file inputs to animal as $media object for form save.
                        // this will be used by the dataAnimalService to save new images
                        $scope.activeAnimal.$media = {
                            images: $element.find('input[type="file"]')
                        };

                        return animalDataService.saveAnimal($scope.activeAnimal)
                    })
                    .then(function (savedAnimal) {
                        $scope.activeAnimal = savedAnimal;
                        $scope.hideLoading();
                        $scope.render();

                        if (opts.visibleNotification) {
                            $scope.showMessage('Successfully saved');
                        }

                        if (opts.updatePetList) {
                            animalDataService.getAnimalsBySpecies($scope.activeAnimal.getSpeciesName())
                        }

                        if (opts.successRedirect){
                            $scope.editPet($scope.activeAnimal);
                        }

                        return Promise.resolve($scope.activeAnimal);
                    });
            };

            /*
             * @param {Object} [options]
             * @param {Boolean} [options.visibleNotification=true]
             * @param {Boolean} [options.successRedirect=false]
             * @returns {Promise}
             */
            $scope.deletePet = function (options) {
                var opts = _.defaults(options, {
                    showNotifications: true,
                    successRedirect: false
                });
                var speciesName = $scope.activeAnimal.getSpeciesName();

                return animalDataService.deleteAnimal($scope.activeAnimal)
                    .then(function () {
                        $scope.clearPetValues();
                        // non-blocking
                        animalDataService.getAnimalsBySpecies(speciesName)
                            .then(function () {

                                $scope.showAnimalSearch();
                                if (opts.visibleNotification) {
                                    $scope.showMessage('Updated pet list');
                                }
                            })
                            .catch(function (err) {

                                if (opts.visibleNotification) {
                                    $scope.showError('Could not update pet list');
                                }

                                return Promise.reject(err);
                            });

                        if (opts.successRedirect){
                            $scope.showAnimalSearch()
                        }
                    })
            };

            /**
             *
             * @return {Promise}
             */
            $scope.reloadPet = function () {

                return animalDataService.fetchAnimal($scope.activeAnimal)
                    .then(function (animal) {
                        $scope.activeAnimal = animal;
                        return Promise.resolve($scope.activeAnimal);
                    });
            };

            /**
             *
             * @param {Object} [options]
             * @param {Boolean} [options.useCache]
             * @returns {Promise}
             */
            $scope.reloadPetSpecies = function (options) {
                var speciesName = $scope.activeAnimal ? $scope.activeAnimal.getSpeciesName() : null;

                if (!speciesName) {
                    return Promise.reject(new Error('petForm.reloadPetSpecies() - could not determine species'))
                }

                return speciesDataService.getSpecies(speciesName, options)
                    .then(function (species) {
                        $scope.activeSpecies = species;
                        $scope.activeAnimal.setProps($scope.activeSpecies.getSpeciesProps());
                        return Promise.resolve($scope.activeAnimal);
                    })
            };

            /**
             *
             * @returns {String}
             */
            $scope.getPetSpeciesName = function () {
                if (!$scope.activeAnimal) {
                    return false;
                }

                return $scope.activeAnimal.getSpeciesName();
            };


            /**
             *
             * @param {Object} propData
             * @return {boolean}
             */
            $scope.isDefaultAllowed = function (propData) {
                return propData.key !== 'species';
            };

            /**
             *
             * @param {Object} propData
             * @returns {Promise}
             */
            $scope.setAsDefault = function (propData, options) {
                var opts = _.defaults(options, {
                    visibleNotification: true
                });

                $scope.showLoading();
                userService.setUserDefault(propData);

                return userService.saveCurrentUser()
                    .then(function () {
                        $scope.hideLoading();

                        if (opts.visibleNotification) {
                            $scope.showMessage("Saved default for '" + propData.key + "'");
                        }
                    })
                    .catch(function (err) {

                        $scope.hideLoading();
                        $scope.showError("Could not save default for '" + propData.key + "'");

                        return Promise.reject(err);
                    })
            };

            /**
             *
             * @param {String} propData
             * @returns {Promise}
             */
            $scope.resetFromDefault = function (propData) {
                var userDefault = userService.getUserDefault(propData.key);

                if (userDefault) {
                    $scope.activeAnimal.setValue(propData.key, userDefault.val);
                } else {
                    $scope.activeAnimal.setValue(propData.key, propData.defaultVal);
                }

                $scope.showMessage("Reset '" + propData.key + "'");
                return $scope.render();
            };

            (function init() {
                console.log('init form: %o', $routeParams);
                $scope.menu = {
                    isOpen: false,
                    actions: [
                        {
                            onClick: function () {
                                $scope.savePet({visibleNotification: true, successRedirect: true})
                            },
                            label: 'save',
                            icon: 'save'
                        },
                        {
                            onClick: function () {
                                $scope.deletePet({successRedirect: true})
                            },
                            label: 'delete',
                            icon: 'delete_forever'
                        }
                    ]
                };
                var animalSpeciesWatchHandler = $scope.$watch('getPetSpeciesName()', function (currentFormSpecies) {
                    console.log('getPetSpeciesName() = %s', currentFormSpecies);
                    Promise.resolve(currentFormSpecies)
                        .then(function (currentFormSpecies) {

                            // fetch pet by URL params if possible
                            if ($routeParams.petId && !$scope.activeAnimal) {
                                return $scope.loadPetById($routeParams.petId)
                                    .then(function () {
                                        return $scope.render();
                                    })
                                    .then(function(){
                                        return $scope.activeAnimal.getSpeciesName();
                                    });
                            }

                            if (!currentFormSpecies) {
                                return $scope.promptSpeciesSelection()
                            }

                            return currentFormSpecies
                        })
                        .then(function (speciesName) {
                            return speciesDataService.getSpecies(speciesName);
                        })
                        .then(function(species){
                            $scope.activeSpecies = species;
                            return speciesDataService.getSpeciesList()
                        })
                        .then(function (speciesList) {
                            var speciesProp = $scope.activeSpecies.getProp('species');

                            speciesProp.options = speciesList;
                            $scope.activeSpecies.setProps([speciesProp]);

                            if (!$scope.activeAnimal) {
                                $scope.activeAnimal = new Animal($scope.activeSpecies);
                            } else {
                                $scope.activeAnimal.setProps($scope.activeSpecies.getSpeciesProps());
                                $scope.activeAnimal.setValue('species', $scope.activeSpecies.getSpeciesName());
                            }

                            // $apply necessary to inform angular of data change
                            $scope.$apply(function(){
                                $scope.render();
                            })
                        });

                    var formDestroyHandler = $scope.$on('$destroy', function () {
                        animalSpeciesWatchHandler();
                        formDestroyHandler();
                        if ($scope.killSpeciesPrompt) $scope.killSpeciesPrompt();
                    });
                });

            })();
        }
    }
});
