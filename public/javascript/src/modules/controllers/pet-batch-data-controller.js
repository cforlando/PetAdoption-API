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
            $scope.petData = {
                species : {}
            };

            $scope.hideDialog = function () {
                $scope.$broadcast('dialog:hide');
            };


            $scope.getActiveSpecies = function () {
                var defaultSpecies = 'dog',
                    species = false;
                _.forEach($scope.selectedPetsIndexCollection, function (petData, petIndex) {
                    if (petData && petData.species){
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


            /**
             *
             * @param {Object} [options]
             * @param {Function} [options.done]
             * @param {String} [options.species]
             */
            $scope.updatePetData = function (options) {
                $scope.showLoading();
                var _options = _.defaults(options, {}),
                    species = _options.species || $scope.getActiveSpecies();
                console.log("petList updating petData w/ %s", species);
                $scope.getModel(species, {
                    callback: function (err, model) {
                        $scope.hideLoading();
                        if (err) {
                            $scope.showError('Could not get model for ' + species);
                        } else {
                            var batchPetData = _.reduce(model, function (props, propData, propName) {
                                switch (propName) {
                                    case 'petId':
                                    case 'petName':
                                    case 'images':
                                    case 'shelterGeoLat':
                                    case 'shelterGeoLon':
                                    case 'lostGeoLat':
                                    case 'lostGeoLon':
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
                            console.log("petList updating petData w/ %s: %o", species, batchPetData);
                            $scope.petData = batchPetData;
                            $scope.$broadcast('update:petData');
                        }
                        if(_options.done) _options.done();
                    },
                    useCache: true,
                    updatePetData: false
                });
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

            // override setField function for batch edit
            $scope.setField = function (propName, propData) {
                console.log('petList: batch set: %o', arguments);
                $scope.petData[propName] = propData;
            };

            /**
             *
             * @param {Object} [options]
             * @param {Function} options.done
             */
            $scope.savePet = function (options) {
                var _options = _.defaults({
                    doneMessage: 'All pets updated'
                }, options);
                $scope.showLoading();
                async.eachSeries($scope.selectedPetsDataCollection, function each(petData, done) {
                    if (!petData) done();
                    $scope.getPet(petData, function (err, petData) {
                        if (err) {
                            $scope.showError('Could not save pet data');
                            done(new Error('Could not save pet data'));
                        } else {
                            console.log('petList: getPet result: %o', petData);
                            _.forEach($scope.petData, function (batchPropData, batchPropName) {
                                if (batchPropData.val) {
                                    petData[batchPropName] = petData[batchPropName] || batchPropData;
                                    petData[batchPropName].val = batchPropData.val;
                                    console.log('petList: batch updating %s', batchPropName);
                                }
                            });
                            console.log('petList: saving %s[%s]', petData.petName.val, petData.petId.val);
                            $scope.$parent.savePet(petData, {
                                setPetData: false,
                                syncShelterMap: false,
                                updatePetList: false,
                                done: function (err) {
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
            $scope.deletePet = function (options) {
                var _options = _.defaults({
                    doneMessage: 'All pets deleted'
                }, options);
                $scope.showLoading();
                async.eachSeries($scope.selectedPetsDataCollection, function each(petData, done) {
                    if (!petData) done();
                    $scope.getPet(petData, function (err, petData) {
                        if (err) {
                            $scope.showError('Could not delete data');
                            done(new Error('Could not delete pet'));
                        } else {
                            console.log('petList: getPet result: %o', petData);
                            $scope.$parent.deletePet(petData, {
                                updatePetList: false,
                                done: function (err) {
                                    console.log('petList: deletedPet');
                                    done(err);
                                }
                            })
                        }
                    })
                }, function complete(deleteErr) {
                    onBatchEditComplete(deleteErr, _options);
                    console.log('petList: result: %o', arguments);
                })
            };

            $scope.batchEdit = function (ev) {
                $scope.updatePetData({
                    done : function(){
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
                            preserveScope : true,
                            clickOutsideToClose: true
                        })
                    }
                });
            };

            /**
             *
             * @param opErr
             * @param {Object} options
             */
            function onBatchEditComplete(opErr, options) {
                $scope.$parent.getPetList(function (petListErr) {
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

            function init() {
                $scope.$watch('petData.species.val', function (newValue, oldValue) {
                    console.log('petList: petData.species.val - changed: %s', newValue);
                    var speciesIndex = _.indexOf($scope.speciesList, newValue);
                    if (speciesIndex > -1) {
                        console.log('petList: petData.species.val - updating w/: %s', newValue);
                        $scope.updatePetData({
                            species : newValue
                        });
                    }
                });
            }

            init();
            console.log('petBatchDataController($scope = %o)', $scope);
        }]);
});
