define([
    'require',
    'underscore',
    'async',
    'ngApp'
], function(require) {
    var ngApp = require('ngApp'),
        async = require('async'),
        _ = require('underscore');
    ngApp.controller('petBatchDataController', ['$scope', '$mdDialog', function($scope, $mdDialog) {
        $scope.selectedPetsDataCollection = {};
        $scope.selectedPetsIndexCollection = {};
        $scope.batchFormScopes = {
            registered: []
        };

        $scope.hideDialog = function() {
            $scope.$broadcast('dialog:hide');
        };


        $scope.getActiveSpecies = function() {
            var defaultSpecies = 'dog',
                species = false;
            _.forEach($scope.selectedPetsIndexCollection, function(petData, petIndex) {
                if (petData && petData.species) {
                    species = petData.species.val;
                    return false;
                }
            });
            species = (!species && $scope.speciesList) ? $scope.speciesList[$scope.petList.currentSpeciesIndex] : species;
            return (species || defaultSpecies).toLowerCase();
        };

        $scope.isBatchEditActive = function() {
            return (_.keys($scope.selectedPetsDataCollection).length > 0);
        };


        $scope.saveModel = function(petData, options) {
            var _options = _.defaults(options, {}),
                species = _options.species || $scope.getActiveSpecies();
            $scope.$parent.getModel(species, {

                callback: function(err, model) {
                    if (err) {
                        if (_options.done) _options.done(null, petData);
                    } else {
                        var newModelData = {};
                        _.forEach(model, function(propData, propName) {
                            newModelData[propName] = _.defaults({
                                options: petData[propName].options
                            }, model[propName]);
                        });
                        $scope.$parent.saveModel(newModelData, {
                            done: function(err, petData) {
                                if (err) {
                                    if (_options.done) _options.done(null, petData);
                                } else {
                                    var updatedPetData = {};
                                    _.forEach(petData, function(propData, propName) {
                                        updatedPetData[propName] = _.defaults({
                                            options: petData[propName].options
                                        }, petData[propName]);
                                    });
                                    if (_options.done) _options.done(null, updatePetData);
                                }
                            }
                        });
                    }
                }
            });

        };


        /**
         *
         * @param {Object} [options]
         * @param {Function} [options.callback]
         * @param {String} [options.species]
         */
        $scope.getModel = function(species, options) {
            var _options = _.defaults(options, {}),
                species = _options.species || $scope.getActiveSpecies();
            console.log("petList updating petData w/ %s", species);
            $scope.$parent.getModel(species, {
                callback: function(err, model) {
                    if (err) {
                        $scope.showError('Could not get model for ' + species);
                        if (_options.callback) _options.callback(err);
                    } else {
                        var batchPetData = _.reduce(model, function(props, propData, propName) {
                            switch (propName) {
                                case 'petId':
                                case 'petName':
                                case 'images':
                                    // ignore these fields as they should never be batch edited
                                case 'shelterGeoLat':
                                case 'shelterGeoLon':
                                case 'lostGeoLat':
                                case 'lostGeoLon':
                                    // ignore these as rendering 4 maps may have performance consequences
                                    break;
                                case 'species':
                                    props[propName] = propData;
                                    props[propName].val = species;
                                    break;
                                default:
                                    props[propName] = _.omit(propData, ['val']);
                            }
                            return props;
                        }, {});
                        console.log("petList updating petForm w/ petData(%s): %o", species, batchPetData);
                    }
                    console.log("petList updated petForm w/ petData");
                    if (_options.callback) _options.callback(null, batchPetData);
                },
                useCache: true
            });
        };

        $scope.updatePetSelection = function(petIndexID, petData) {
            if ($scope.selectedPetsDataCollection[petIndexID]) {
                delete $scope.selectedPetsDataCollection[petIndexID];
            } else {
                $scope.selectedPetsDataCollection[petIndexID] = petData;
            }
        };

        $scope.clearSelectedPets = function() {

            _.forEach($scope.selectedPetsIndexCollection, function(val, index) {
                $scope.selectedPetsIndexCollection[index] = false;
            });

            _.forEach($scope.selectedPetsDataCollection, function(val, index) {
                delete $scope.selectedPetsDataCollection[index];
            });
        };


        /**
         *
         * @param {Object} [options]
         * @param {Function} options.done
         */
        $scope.savePet = function(options) {
            var _options = _.defaults({
                doneMessage: 'All pets updated'
            }, options);
            async.eachSeries($scope.selectedPetsDataCollection, function each(petData, done) {
                if (!petData) done();
                $scope.getPet(petData, function(err, petData) {
                    if (err) {
                        $scope.showError('Could not save pet data');
                        done(new Error('Could not save pet data'));
                    } else {
                        console.log('petList.savePet() - getPet result: %o', petData);
                        _.forEach($scope.batchFormScopes.registered, function($formScope) {
                            console.log('petList: updating form[%o]', $formScope.petData);
                            _.forEach($formScope.petData, function(propData, propName) {
                                if (propData && propData.val) {
                                    petData[propName] = petData[propName] || propData;
                                    petData[propName].val = propData.val;
                                    console.log('petList: batch updating %s', propName);
                                }
                            });
                        });
                        console.log('petList: saving %s[%s]', petData.petName.val, petData.petId.val);
                        $scope.$parent.savePet(petData, {
                            done: function(err) {
                                console.log('petList: savedPet');
                                done(err);
                            }
                        })
                    }
                })
            }, function complete(saveErr) {
                onBatchEditComplete(saveErr, _options);
                console.log('petList: result: %o', arguments);
            })
        };


        /**
         *
         * @param {Object} [options]
         * @param {Function} options.done
         */
        $scope.deletePet = function(options) {
            var _options = _.defaults({
                doneMessage: 'All pets deleted'
            }, options);
            $scope.showLoading();
            async.eachSeries($scope.selectedPetsDataCollection, function each(petData, done) {
                if (!petData) done();
                $scope.getPet(petData, function(fetchErr, petData) {
                    if (fetchErr) {
                        $scope.hideLoading();
                        $scope.showError('Could not delete data');
                        if(_options.done) _options.done(fetchErr);
                        done(fetchErr);
                    } else {
                        console.log('petList: getPet result: %o', petData);
                        $scope.$parent.deletePet(petData, {
                            updatePetList: false,
                            done: function(deleteErr) {
                                $scope.hideLoading();
                                if(_options.done) _options.done.apply(null, arguments);
                                console.log('petList: deletedPet');
                                done(deleteErr);
                            }
                        })
                    }
                })
            }, function complete(deleteErr) {
                onBatchEditComplete(deleteErr, _options);
                console.log('petList: result: %o', arguments);
            })
        };

        $scope.batchEdit = function(ev) {
            $mdDialog.show({
                controller: function($scope, $mdDialog) {
                    var hideListenerRemover = $scope.$on('dialog:hide', function() {
                        console.log('petList: mdDialog: closing dialog');
                        $mdDialog.hide();
                        hideListenerRemover();
                    })
                },
                contentElement: '#batch-edit-dialog',
                parent: angular.element(document.body),
                targetEvent: ev,
                scope: $scope,
                preserveScope: true,
                clickOutsideToClose: true
            })
        };

        $scope.registerForm = function($formScope) {
            $scope.batchFormScopes.registered.push($formScope);
            $scope.getSpeciesList(function() {
                _.forEach($scope.batchFormScopes.registered, function($formScope) {
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


        /**
         *
         * @param opErr
         * @param {Object} options
         */
        function onBatchEditComplete(opErr, options) {
            $scope.$parent.getPetList(function(petListErr) {
                $scope.hideLoading();
                $scope.showMessage(options.doneMessage || "All pets updated");
                $scope.hideDialog();
                $scope.clearSelectedPets();
                if (options.done) options.done.apply(null, [opErr || petListErr]);
                // $scope.clearSelectedPets();
            }, {
                species: $scope.getActiveSpecies()
            });
        }

        console.log('petBatchDataController($scope = %o)', $scope);
    }]);
});