define([
    'require',
    'angular',
    'underscore',
    'async',
    'modules/controllers/form-controller',
    'text!modules/views/dialogs/new-animal.html',
    'ngApp'
], function (require) {
    var angular = require('angular'),
        ngApp = require('ngApp'),
        async = require('async'),
        _ = require('underscore');

    console.log('loading petFormController');

    return ngApp.controller('petFormController', [
        '$scope', '$element', 'request', '$timeout', '$mdToast', '$mdDialog', 'dataParser', 'addressFinderService', '$routeParams', '$controller',
        function ($scope, $element, request, $timeout, $mdToast, $mdDialog, dataParser, addressFinderService, $routeParams, $controller) {
            console.log('init petFormController');
            angular.extend(this, $controller('formController', {$scope: $scope}));

            $scope.petData = {};
            $scope.fab = {
                isOpen: false
            };
            console.log("petDataForm.$scope: %o", $scope);

            $scope.toggleFAB = function () {
                $scope.fab.isOpen = !$scope.fab.isOpen;
            };

            $scope.upload = function () {
                $scope.mediaScope.upload();
            };


            $scope.setFormSpecies = function (species) {
                if (species) {
                    $scope.petData = $scope.petData || {};
                    $scope.petData['species'] = $scope.petData['species'] || {};
                    $scope.petData['species'].val = species;
                    console.log('set species to %s', $scope.petData['species'].val);
                } else {
                    console.log('ignoring species value of: %s', species);
                }
            };

            $scope.setField = function (fieldName, fieldData) {
                $scope.petData[fieldName] = _.extend({}, $scope.petData[fieldName], fieldData);
                //console.log('%s set to %o', fieldName, $scope.petData[fieldName]);
            };
            /**
             *
             * @param {Object} mediaScope
             */
            $scope.registerMediaScope = function (mediaScope) {
                $scope.mediaScope = mediaScope;
            };


            $scope.clearFileInputs = function () {
                if ($scope.mediaScope) $scope.mediaScope.clear();
            }

            /**
             *
             * @param {Object[]} [model]
             */
            $scope.render = function (model) {
                var speciesProps = model || $scope.models[$scope.petData.species.val];

                _.forEach(speciesProps, function (propData) {
                    if ($scope.petData[propData.key]) {
                        $scope.petData[propData.key] = _.defaults({
                            val: $scope.petData[propData.key].val
                        }, propData);
                    } else {
                        $scope.petData[propData.key] = propData;
                    }
                });

                var renderData = dataParser.buildRenderData(model || $scope.petData);
                console.log('rendering: %o', renderData);
                $scope.properties = renderData;
            };

            function getShelterAddress() {
                var shelterLocationProperties = ['shelterAddrLine1', 'shelterAddrLine2', 'shelterAddrCity', 'shelterAddrSt', 'shelterAddrZip'],
                    shelterLocationValues = shelterLocationProperties.map(function (propName, index) {
                        return ($scope.petData[propName] || {}).val;
                    });
                return shelterLocationValues.join(' ');
            }

            $scope.syncShelterAddressMap = function (callback) {
                addressFinderService.findCoordinates(getShelterAddress(), function (result) {
                    if (result) {
                        console.log('shelterAddressChange() = %o', result);
                        var confirmDialog = $mdDialog.confirm()
                            .title('Would you like to use this shelter address?')
                            .textContent(result['address'])
                            .ariaLabel('Shelter Address')
                            .ok('Yes')
                            .cancel('No');
                        $mdDialog.show(confirmDialog).then(function onAccept() {
                            console.log('shelterAddressChange() - shelterGeoLat <- %s | shelterGeoLon <- %s', result['lat'], result['lng']);
                            $scope.petData['shelterGeoLat'].val = result['lat'];
                            $scope.petData['shelterGeoLon'].val = result['lng'];
                            if (callback) callback();
                        }, function onDecline() {
                            console.log('cancelled');
                            if (callback) callback();
                        });
                    } else {
                        if (callback) callback();
                    }
                });
            };

            /**
             *
             * @param speciesName
             * @param [options]
             * @param [options.useDefaults=true]
             */
            $scope.updatePetDataFromModel = function (speciesName, options) {
                var _options = _.defaults(options, {
                    useDefaults: false
                });
                // var species = modelName || ($scope.petData.species) ? $scope.petData.species.val || $scope.petData.species.defaultVal || $scope.petData.species.example : false;
                if (!speciesName) {
                    console.error('petForm.updatePetDataFromModel() - could not determine species');
                    $scope.showError("Could not determine species");
                }
                $scope.getSpecies(speciesName, {
                    callback: function (err, model) {
                        if (err) {
                            console.error(err);
                        } else {
                            var petData = {},
                                userDefaultData,
                                userDefaultPropData;

                            _.forEach(model, function (propData) {
                                if (_options.useDefaults) {
                                    userDefaultData = $scope.getUserDefault(propData.key);
                                    if (userDefaultData) {
                                        userDefaultPropData = _.defaults(userDefaultData, propData);
                                        userDefaultPropData.val = dataParser.getFormattedPropValue(userDefaultPropData);
                                    } else {
                                        userDefaultPropData = false;
                                    }
                                } else {
                                    userDefaultPropData = false;
                                }
                                petData[propData.key] = _.defaults({
                                    val: ($scope.petData[propData.key]) ? $scope.petData[propData.key].val : (userDefaultPropData) ? userDefaultPropData.val : null
                                }, propData);
                                // update the species options. Not sure why, but couldn't hurt
                                if (propData.key == 'species') petData[propData.key].options = $scope.speciesList;
                            });
                            $scope.petData = petData;
                            $scope.render($scope.petData);
                        }
                    }
                })
            };

            $scope.createOption = function (fieldName, val) {
                console.log(arguments);
                var speciesName = $scope.petData.species.val,
                    speciesProp = $scope.getSpeciesProp(speciesName, fieldName);

                speciesProp.options = _.uniq([val].concat(speciesProp.options));
                $scope.setSpeciesProp(speciesName, speciesProp);
                console.log('updated %s prop: %o', speciesName, speciesProp);
                $scope.saveSpecies(speciesName, $scope.models[speciesName], {
                    done: function (err, speciesData) {
                        $scope.render();
                        $scope.showMessage('Option saved');
                    }
                });
            };

            /**
             *
             * @param {Object} newPropData
             * @param {Object} [options]
             * @param {Boolean} options.reset
             */
            $scope.setPet = function (newPropData, options) {
                if (!newPropData) return $scope.showError('Could not load pet');
                console.log('petForm.setPet(%o)', newPropData);
                var _options = _.defaults(options, {}),
                    currentPetDataKeys = Object.keys($scope.petData),
                    newPetPropsKeys = Object.keys(newPropData),
                    propKeysDiff = _.difference(currentPetDataKeys, newPetPropsKeys),
                    petData = dataParser.convertToPetData(newPropData);
                console.log('petForm.setPet() w/ petData', petData);
                _.forEach(propKeysDiff, function (propName) {
                    // clear non-existent properties
                    $scope.petData[propName].val = null;
                });
                _.forEach(petData, function (newPropData, propName) {
                    $scope.petData[propName] = $scope.petData[propName] || {};
                    if (_options.reset && propName != 'species') {
                        $scope.petData[propName].val = null;
                    } else {
                        $scope.petData[propName].val = (newPropData.val) ? newPropData.val : null;
                    }
                    if (newPropData.key) $scope.petData[propName].key = newPropData.key;
                    if (newPropData.defaultVal) $scope.petData[propName].defaultVal = newPropData.defaultVal;
                    if (newPropData.valType) $scope.petData[propName].valType = newPropData.valType;
                    if (newPropData.options) $scope.petData[propName].options = newPropData.options;
                });
                $scope.render($scope.petData);
            };

            $scope.loadPet = function (props, done) {
                $scope.showLoading();
                console.log('petForm.loadPet(%o)', props);
                $scope.getPet(props, {
                    done: function (err, petData) {
                        if (err) {
                            $scope.hideLoading();
                            console.error(err);
                            $scope.showError('Could not load pet');
                        } else {
                            $scope.setPet(petData);
                            $scope.hideLoading();
                            $scope.showMessage('Successfully loaded pet');
                        }
                        if (_.isFunction(done)) done.apply(null, arguments);
                    }
                });
            };

            /**
             *
             * @param {Object} [options]
             * @param {Boolean} [options.idOnly]
             */
            $scope.clearPetData = function (options) {
                var _options = _.defaults(options, {
                    idOnly: false
                });
                if (_options.idOnly === true) {
                    if ($scope.petData) $scope.petData['petId'].val = null;
                } else {
                    _.forEach($scope.petData, function (propData, propName) {
                        if (propName != 'species') {
                            $scope.petData[propName].val = null;
                        }
                    });
                }
                $scope.render($scope.petData);
            };

            $scope.savePet = function (options) {
                var _options = _.defaults(options, {
                    setPetData: true,
                    updatePetList: true,
                    syncShelterMap: true
                });

                if (_options.syncShelterMap) {
                    $scope.syncShelterAddressMap(savePetData);
                } else {
                    savePetData()
                }

                function formatData(petData) {
                    if ($scope.mediaScope) {
                        var formattedData = angular.copy(petData);
                        formattedData.$media = $scope.mediaScope.get$inputs();
                    }

                    if (formattedData.images) {
                        formattedData.images.val = _.filter(formattedData.images.val, function (imageURL) {
                            // remove preview data urls
                            return imageURL && !(/^data/.test(imageURL));
                        })
                    }
                    return formattedData;
                }

                function savePetData() {
                    // avoid polluting the form's petData
                    var petData = formatData($scope.petData);
                    $scope.$parent.savePet(petData, {
                        done: function (err, responsePetData) {
                            $scope.hideLoading();
                            if (err) {
                                // $mdToast.show($mdToast.simple().textContent('Could not save pet'));
                            } else {
                                $scope.clearFileInputs();
                                if (_options.setPetData) {
                                    $scope.setPet(responsePetData);
                                }
                                if (_options.updatePetList) {
                                    $scope.getPetList(false, {
                                        done: function () {
                                            $scope.hideLoading();
                                            if (_.isFunction(_options.done)) _options.done.apply(null, [null, responsePetData]);
                                        }
                                    });
                                } else {
                                    if (_.isFunction(_options.done)) _options.done.apply(null, [null, responsePetData]);
                                }
                            }
                        }
                    });
                }
            };

            /*
             * @param {Object} [options]
             * @param {Function} [options.donem
             */
            $scope.deletePet = function (options) {
                var _options = _.defaults(options, {});
                $scope.$parent.deletePet($scope.petData, {
                    done: function (err, response) {
                        if (err) {
                            if (_options.done) _options.done.apply(null, arguments);
                        } else {
                            $scope.clearPetData();
                            $scope.getPetList(null, {
                                done: function (err) {
                                    if (err) {
                                        $scope.showError('Could not update pet list');
                                    } else {
                                        $scope.showMessage('Updated pet list');
                                    }
                                    if (_options.done) _options.done.apply(null, arguments);
                                    $scope.showAnimalSearch();
                                }
                            });
                        }
                    }
                });
            };

            $scope.refreshPetData = function () {
                console.log('petForm.refreshPetData(%o)', $scope.petData);
                $scope.getPet($scope.petData, {
                    done: function (err, petData) {
                        if (err) {
                            console.error(err);
                        } else {
                            $scope.setPet(petData);
                        }
                    }
                })
            };

            $scope.requestSpecies = function (callback, options) {
                var _options = _.defaults(options, {}),
                    speciesList = $scope.speciesList;

                $mdDialog.show({
                    controller: function ($scope, $mdDialog) {
                        $scope.selectSpecies = function (selectedSpecies) {
                            $mdDialog.hide(selectedSpecies);
                        };

                        $scope.speciesList = speciesList;
                    },
                    template: require('text!modules/views/dialogs/new-animal.html'),
                    parent: angular.element('.pet-data-form'),
                    clickOutsideToClose: false,
                    escapeToClose: false
                }).then(
                    function confirm(speciesName) {
                        callback(speciesName);
                    },
                    function cancel() {
                        callback();
                    });
            };

            $scope.isDefaultAllowed = function (propData) {
                return propData.key != 'species';
            };

            $scope.setAsDefault = function (propData) {
                $scope.showLoading();
                $scope.setUserDefault(propData);
                $scope.saveUser({
                    done: function (err, user) {
                        $scope.hideLoading();
                        if (err) {
                            $scope.showError("Could not save default for '" + propData.key + "'");
                        } else {
                            $scope.showMessage("Saved default for '" + propData.key + "'");
                        }
                    }
                })
            };

            $scope.resetFromDefault = function (propData) {
                var userDefault = $scope.getUserDefault(propData.key),
                    savedPropData = $scope.petData[propData.key];
                if (userDefault) {
                    var formattedPropValue = dataParser.getFormattedPropValue(_.defaults({
                        val: userDefault.val
                    }, savedPropData));
                    propData.val = formattedPropValue;
                } else {
                    propData.val = savedPropData.defaultVal || propData.val;
                }
                $scope.showMessage("Reset '" + propData.key + "'");
            };

            function init() {
                console.log('init form: %o', $routeParams);
                if ($routeParams.petId) {
                    // Is main view
                    // load pet per URL
                    $scope.loadPet({
                        petId: {
                            key: 'petId',
                            val: $routeParams.petId
                        },
                        species: {
                            key: 'species',
                            val: $routeParams.petSpecies
                        }
                    });
                    $scope.registerMenuActions([
                        {
                            onClick: function () {
                                $scope.savePet()
                            },
                            label: 'save',
                            icon: 'save'
                        },
                        {
                            onClick: function () {
                                $scope.deletePet()
                            },
                            label: 'delete',
                            icon: 'delete_forever'
                        },
                        {
                            onClick: function () {
                                $scope.clearPetData()
                            },
                            label: 'clear',
                            icon: 'clear'
                        }
                    ]);
                } else if ($scope.isBatchEditActive && $scope.isBatchEditActive()) {
                    $scope.registerForm($scope);
                }

                $scope.getSpeciesList(function () {
                    $scope.$watch('petData.species.val', function (speciesVal, oldSpeciesVal) {
                        console.log('petData.species.val: %s', speciesVal);

                        if (_.includes($scope.speciesList, speciesVal)) {
                            // load species model
                            $scope.updatePetDataFromModel(speciesVal, {
                                useDefaults: true
                            });
                        } else {
                            // species not set
                            if ($scope.isBatchEditActive && $scope.isBatchEditActive()) {
                                // species will be set by petListController

                            } else {
                                $scope.requestSpecies(function (speciesName) {
                                    $scope.setFormSpecies(speciesName);
                                })
                            }
                        }
                    });

                });

            }

            init();
        }
    ]);

});
