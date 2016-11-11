define([
    'require',
    'underscore',
    'async',
    'ngApp'
], function (require) {
    var ngApp = require('ngApp'),
        async = require('async'),
        _ = require('underscore');
    ngApp.controller('batchDataController', [
        '$scope',
        function ($scope) {

            /**
             *
             * @param opErr
             * @param {Object} options
             */
            function onBatchEditComplete(opErr, options) {
                $scope.getPetList($scope.getActiveSpecies(), {
                    done: function (petListErr) {
                        $scope.hideLoading();
                        $scope.showMessage(options.doneMessage || "All pets updated");
                        $scope.clearSelectedPets();
                        if (options.done) options.done.apply(null, [opErr || petListErr]);
                    }
                });
            }


            /**
             *
             * @param {String} species
             * @param {Object} [options]
             * @param {Function} [options.callback]
             * @param {String} [options.species]
             */
            $scope.getSpecies = function (species, options) {
                var _options = _.defaults(options, {}),
                    modelSpecies = species || options.species || $scope.getActiveSpecies();
                console.log("petList updating petData w/ %s", modelSpecies);
                $scope.$parent.getSpecies(modelSpecies, {
                    callback: function (err, model) {
                        if (err) {
                            $scope.showError('Could not get model for ' + modelSpecies);
                            if (_options.callback) _options.callback(err);
                        } else {
                            var batchPetData = _.map(model, function (propData) {
                                switch (propData.key) {
                                    case 'species':
                                        propData.val = modelSpecies;
                                        return propData;
                                        break;
                                    default:
                                        return _.omit(propData, ['val']);
                                }
                            });
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
             * @param {Object} batchPetProps
             * @param {Object} [options]
             * @param {Function} [options.done]
             */
            $scope.savePet = function (batchPetProps, options) {
                var _options = _.defaults({
                    doneMessage: 'All pets updated'
                }, options);
                async.eachSeries($scope.selectedPetsDataCollection, function each(selectedPetData, done) {
                    if (!selectedPetData) done();
                    $scope.getPet(selectedPetData, {
                        showSuccessNotification: false,
                        done: function (err, petData) {
                            if (err) {
                                $scope.showError('Could not save pet data');
                                done(new Error('Could not save pet data'));
                            } else {
                                console.log('petList.savePet() - getPet result: %o', petData);
                                _.forEach(batchPetProps, function (batchPropData) {
                                    if (batchPropData && batchPropData.val !== undefined && batchPropData.val !== null && $scope.isEditableByBatch(batchPropData)) {
                                        petData[batchPropData.key] =  batchPropData;
                                        console.log('petList: batch updating %s to %s', batchPropData.key, petData[batchPropData.key].val);
                                    }
                                });
                                console.log('petList: saving %s[%s]', petData.petName.val, petData.petId.val);
                                $scope.$parent.savePet(petData, {
                                    showSuccessNotification: false,
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
                                    showSuccessNotification: false,
                                    done: function (deleteErr) {
                                        $scope.hideLoading();
                                        if (_options.updatePetList) {
                                            $scope.getPetList(false, {
                                                showSuccessNotification: false,
                                                done: function () {
                                                    done(deleteErr);
                                                }
                                            })
                                        } else {
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

            console.log('batchDataController($scope = %o)', $scope);
        }]);
});
