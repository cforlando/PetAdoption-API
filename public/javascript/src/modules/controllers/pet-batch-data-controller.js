define([
    'require',
    'underscore',
    'async',
    'ngApp'
], function (require) {
    var ngApp = require('ngApp'),
        async = require('async'),
        _ = require('underscore');
    ngApp.controller('petBatchDataController', ['$scope', '$mdDialog', function ($scope, $mdDialog) {
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


        $scope.saveModel = function (petData, options) {
            var _options = _.defaults(options, {}),
                species = _options.species || $scope.getActiveSpecies();
            $scope.$parent.getModel(species, {

                callback: function (err, model) {
                    if (err) {
                        if (_options.done) _options.done(null, petData);
                    } else {
                        var newModelData = {};
                        _.forEach(model, function (propData, propName) {
                            newModelData[propName] = _.defaults({
                                options: petData[propName].options
                            }, model[propName]);
                        });
                        $scope.$parent.saveModel(newModelData, {
                            done: function (err, petData) {
                                if (err) {
                                    if (_options.done) _options.done(null, petData);
                                } else {
                                    var updatedPetData = {};
                                    _.forEach(petData, function (propData, propName) {
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
         * @param {String} species
         * @param {Object} [options]
         * @param {Function} [options.callback]
         * @param {String} [options.species]
         */
        $scope.getModel = function (species, options) {
            var _options = _.defaults(options, {}),
                modelSpecies = species || options.species || $scope.getActiveSpecies();
            console.log("petList updating petData w/ %s", modelSpecies);
            $scope.$parent.getModel(modelSpecies, {
                callback: function (err, model) {
                    if (err) {
                        $scope.showError('Could not get model for ' + modelSpecies);
                        if (_options.callback) _options.callback(err);
                    } else {
                        var batchPetData = _.reduce(model, function (props, propData, propName) {
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
                                    props[propName].val = modelSpecies;
                                    break;
                                default:
                                    props[propName] = _.omit(propData, ['val']);
                            }
                            return props;
                        }, {});
                        console.log("petList updating petForm w/ petData(%s): %o", modelSpecies, batchPetData);
                    }
                    console.log("petList updated petForm w/ petData");
                    if (_options.callback) _options.callback(null, batchPetData);
                },
                useCache: true
            });
        };

        /**
         *
         * @param {Object} petProps
         * @param {Object} [options]
         * @param {Function} [options.done]
         */
        $scope.savePet = function (petProps, options) {
            var _options = _.defaults({
                doneMessage: 'All pets updated'
            }, options);
            async.eachSeries($scope.selectedPetsDataCollection, function each(selectedPetData, done) {
                if (!selectedPetData) done();
                $scope.getPet(selectedPetData, {
                    done: function (err, petData) {
                        if (err) {
                            $scope.showError('Could not save pet data');
                            done(new Error('Could not save pet data'));
                        } else {
                            console.log('petList.savePet() - getPet result: %o', petData);
                            _.forEach(petProps, function (propData, propName) {
                                if (propData && propData.val) {
                                    petData[propName] = petData[propName] || propData;
                                    petData[propName].val = propData.val;
                                    console.log('petList: batch updating %s to %s', propName, petData[propName].val);
                                }
                            });
                            console.log('petList: saving %s[%s]', petData.petName.val, petData.petId.val);
                            $scope.$parent.savePet(petData, {
                                done: function (err) {
                                    console.log('petList: savedPet');
                                    done(err);
                                }
                            })
                        }
                    }
                })
            }, function complete(saveErr) {
                onBatchEditComplete(saveErr, _options);
                console.log('petList: result: %o', arguments);
            })
        };


        /**
         *
         * @param {Object} petData
         * @param {Object} [options]
         * @param {Function} [options.done]
         * @param {Function} [options.updatePetList]
         */
        $scope.deletePet = function (petData, options) {
            var _options = _.defaults({
                updatePetList: true,
                doneMessage: 'All pets deleted'
            }, options);
            $scope.showLoading();
            async.eachSeries($scope.selectedPetsDataCollection, function each(petData, done) {
                if (!petData) done();
                $scope.getPet(petData, {
                    done: function (fetchErr, fetchedPetData) {
                        if (fetchErr) {
                            $scope.hideLoading();
                            $scope.showError('Could not delete data');
                            if (_options.done) _options.done(fetchErr);
                            done(fetchErr);
                        } else {
                            console.log('petList: getPet result: %o', fetchedPetData);
                            $scope.$parent.deletePet(fetchedPetData, {
                                done: function (deleteErr) {
                                    $scope.hideLoading();
                                    if(_options.updatePetList){
                                        $scope.getPetList(false, { done: function(){
                                            if (_options.done) _options.done.apply(null, arguments);
                                            done(deleteErr);
                                        }} )
                                    } else {
                                        if (_options.done) _options.done.apply(null, arguments);
                                        done(deleteErr);
                                    }
                                    console.log('petList: deletedPet');
                                }
                            })
                        }
                    }
                })
            }, function complete(deleteErr) {
                onBatchEditComplete(deleteErr, _options);
                console.log('petList: result: %o', arguments);
            })
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
                contentElement: '#batch-edit-dialog',
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


        /**
         *
         * @param opErr
         * @param {Object} options
         */
        function onBatchEditComplete(opErr, options) {
            $scope.getPetList($scope.getActiveSpecies(), { done: function (petListErr) {
                $scope.hideLoading();
                $scope.showMessage(options.doneMessage || "All pets updated");
                $scope.hideDialog();
                $scope.clearSelectedPets();
                if (options.done) options.done.apply(null, [opErr || petListErr]);
                // $scope.clearSelectedPets();
            } });
        }

        console.log('petBatchDataController($scope = %o)', $scope);
    }]);
});