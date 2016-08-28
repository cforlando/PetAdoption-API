define([
    'require',
    'underscore',
    'async',
    'ngApp'
], function (require) {
    var ngApp = require('ngApp'),
        async = require('async'),
        _ = require('underscore');

    return ngApp.controller('petFormController', ['$scope', '$element', '$http', '$timeout', '$mdToast', '$mdDialog', 'dataParserService', 'addressFinderService',
        function ($scope, $element, $http, $timeout, $mdToast, $mdDialog, dataParserService, addressFinderService) {

            $scope.isBatchMode = function () {
                return ($scope.selectedPetsDataCollection && _.keys($scope.selectedPetsDataCollection).length > 0);
            };
            $scope.petData = {};
            $scope.mediaInputEl = {
                files: []
            }; // stub in case el is never defined
            $scope.fab = {
                isOpen: false
            };
            console.log("petDataForm.$scope: %o", $scope);

            $scope.toggleFAB = function () {
                $scope.fab.isOpen = !$scope.fab.isOpen;
            };


            $scope.setSpecies = function (species) {
                if (species) {
                    $scope.petData['species'].val = species;
                    console.log('set species to %s', $scope.petData['species'].val);
                }
            };

            $scope.setField = function (fieldName, fieldData) {
                $scope.petData[fieldName] = _.extend({}, $scope.petData[fieldName], fieldData);
                //console.log('%s set to %o', fieldName, $scope.petData[fieldName]);
            };
            /**
             *
             * @param {$scope} $imagesInputScope angular $scope of image input directive (Uses mediaInputEl member for file storage)
             */
            $scope.registerImagesInput = function ($imagesInputScope) {
                $scope.mediaInputEl = $imagesInputScope.mediaInputEl;
            };


            /**
             *
             * @param {Object} model
             */
            $scope.render = function (model) {
                var renderData = dataParserService.formatRenderData(model || $scope.petData);
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
             * @param modelName
             * @param [options]
             * @param [options.useModelValues=true]
             */
            $scope.updatePetDataFromModel = function (modelName, options) {
                var _options = _.defaults(options, {
                    useModelValues: true
                });
                console.log('petForm.updatePetDataFromModel()%s', $scope.isBatchMode() ? ' - batch active' : ' - batch inactive');
                var species = modelName || ($scope.petData.species) ? $scope.petData.species.val || $scope.petData.species.defaultVal || $scope.petData.species.example : false;
                if (species) {
                    $scope.getModel(species, {
                        callback: function (err, model) {
                            console.log('petForm.updatePetDataFromModel() - done');
                            if (err) {
                                console.error('petForm.updatePetDataFromModel(%o)', err);
                                console.error(err);
                            } else {
                                console.log('petForm.updatePetDataFromModel(%o)', model);
                                var petData = {};
                                _.forEach(model, function (propData, propName) {
                                    petData[propName] = _.defaults({
                                        val: ($scope.petData[propName]) ? $scope.petData[propName].val : (_options.useModelValues) ? propData.val : null
                                    }, propData);
                                    // update the species options. Not sure why, but couldn't hurt
                                    if (propName == 'species') petData[propName].options = $scope.speciesList;
                                });
                                $scope.petData = petData;
                                $scope.render($scope.petData);
                            }
                        }
                    })
                } else {
                    console.error('petForm.updatePetDataFromModel() - could not determine species');
                    $scope.showError("Could not determine species");
                }

            };

            $scope.createOption = function (fieldName, val) {
                console.log(arguments);
                $scope.petData[fieldName].options.push(val);
                console.log('_modelData; %o', $scope.petData);
                $scope.saveModel($scope.petData, {
                    done: function (err, petData) {
                        $scope.petData = petData;
                        $scope.render(petData);
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
                    petData = dataParserService.convertToPetData(newPropData);
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

                function formatData(petData){
                    if($scope.mediaInputEl) {
                        var formattedData = _.cloneDeep(petData);
                        formattedData.imageFiles= $scope.mediaInputEl.files
                    }

                    if (formattedData.images){
                        formattedData.images.val = _.filter(formattedData.images.val, function(imageURL){
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
                            if (_options.setPetData) {
                                $scope.setPet(responsePetData);
                            }
                            if (_options.updatePetList) {
                                $scope.getPetList(false, {
                                    done: function () {
                                        $scope.hideLoading();
                                        $mdToast.show($mdToast.simple().textContent('Saved data!'));
                                        if (_.isFunction(_options.done)) _options.done.apply(null, [null, responsePetData]);
                                    }
                                });
                            } else {
                                $scope.hideLoading();
                                $mdToast.show($mdToast.simple().textContent('Saved data!'));
                                if (_.isFunction(_options.done)) _options.done.apply(null, [null, responsePetData]);
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
                                    } else{
                                        $scope.showMessage('Updated pet list');
                                    }
                                    if (_options.done) _options.done.apply(null, arguments);
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

            function init(){
                $scope.registerForm($scope);

                $scope.$watch('petData.species.val', function (newValue, oldValue) {
                    console.log('petData.species.val: %s', newValue);
                    var speciesIndex = _.indexOf($scope.speciesList, newValue);
                    if (speciesIndex > -1) {
                        $scope.updatePetDataFromModel();
                    }
                });
            }

            init();
        }
    ]);

});
