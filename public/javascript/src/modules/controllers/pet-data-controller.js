define([
    'require',
    'underscore',
    'async',
    'ngApp'
], function (require) {
    var ngApp = require('ngApp'),
        async = require('async'),
        _ = require('underscore');

    return ngApp.controller('petDataController', ['$scope', '$http', '$mdToast', '$mdDialog', 'dataParserService', 'addressFinderService',

        function ($scope, $http, $mdToast, $mdDialog, dataParserService, addressFinderService) {

            $scope.models = {};
            $scope.petData = {};
            $scope.petList = {
                currentSpeciesIndex: 0
            };
            $scope.mediaInputEl = {files: []}; // stub in case el is never defined

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

            $scope.setSpecies = function (species) {
                if (species) {
                    $scope.petData['species'].val = species;
                    console.log('set species to %s', $scope.petData['species'].val);
                }
            };

            $scope.setField = function (fieldName, fieldData) {
                $scope.petData[fieldName] = _.extend({}, $scope.petData[fieldName], fieldData);
                console.log('%s set to %o', fieldName, $scope.petData[fieldName]);
            };

            $scope.setMediaInputEl = function (el) {
                $scope.mediaInputEl = el;
            };


            /**
             *
             * @param {String} model
             * @param {Object} [options]
             * @param {Function} [options.callback]
             * @param {Boolean} [options.updatePetData=true]
             * @param {Boolean} [options.useCache=false]
             */
            $scope.getModel = function (model, options) {
                var _options = _.defaults(options, {
                    updatePetData: true,
                    useCache: false,
                });
                console.log('$scope.getModel(%o)', _options);
                $scope.showLoading();
                if (_options.useCache && $scope.models[model]) {
                    $scope.hideLoading();
                    if (_options.updatePetData)  $scope.updatePetDataFromModel();
                    if (_options.callback) _options.callback(null, $scope.models[model]);
                } else {

                    $http.get('/api/v1/model/' + model).then(
                        function success(response) {
                            $scope.hideLoading();
                            $mdToast.show($mdToast.simple().textContent("Successfully fetched " + model + " model"));
                            var parsedResponseData = dataParserService.convertToPetData(response.data);
                            $scope.models[model] = _.extend({}, $scope.models[model], parsedResponseData);
                            if (_options.updatePetData)  $scope.updatePetDataFromModel();
                            if (_options.callback) _options.callback(null, $scope.petData);
                        },
                        function failure() {
                            $scope.hideLoading();
                            $mdToast.show($mdToast.simple().textContent("Sorry. Can't get any info from server."));
                            if (_options.callback) _options.callback(new Error("Could not fetch model"));
                        });
                }
            };


            $scope.updatePetDataFromModel = function (modelName) {
                var species = modelName || ($scope.petData.species) ? $scope.petData.species.val || $scope.petData.species.defaultVal || $scope.petData.species.example : false;
                if (species) {
                    _.forEach($scope.models[species], function (propData, propName) {
                        $scope.petData[propName] = _.defaults({val: ($scope.petData[propName]) ? $scope.petData[propName].val : propData.val}, propData);
                        if (propName == 'species') $scope.petData[propName].options = $scope.speciesList;
                    });
                    $scope.$broadcast('update:petData');
                } else {
                    $scope.showError("Could not update pet options");
                }

            };

            /**
             *
             * @param {Object} [petData]
             * @param {Object} [options]
             * @param {Boolean} [options.updatePetList=true]
             * @param {Function} [options.done]
             */
            $scope.deletePet = function (petData, options) {
                var data = petData || $scope.petData,
                    _options = _.defaults(options, {
                        updatePetList: true
                    });
                $scope.showLoading();
                var formattedData = dataParserService.convertDataToSaveFormat(data);
                console.log('_data; %o', formattedData);

                function onSuccess() {
                    $scope.hideLoading();
                    $mdToast.show($mdToast.simple().textContent('Deleted!'));
                    if (_options.done) _options.done.call();
                }

                $http.post('/api/v1/remove/' + formattedData.species, formattedData).then(
                    function success(response) {
                        $scope.clearPetData();
                        if (_options.updatePetList) {
                            $scope.getPetList(function () {
                                onSuccess();
                            });
                        } else {
                            onSuccess();
                        }
                    },
                    function failure() {
                        $scope.hideLoading();
                        $scope.showError("Could not delete pet");
                        if (_options.done) _options.done.call(null, new Error('Could not delete pet'));
                    }
                );
            };

            $scope.getPet = function (props, done) {
                $scope.showLoading();
                $http.post('/api/v1/query/', dataParserService.convertDataToSaveFormat(props)).then(
                    function success(response) {
                        var _persistedData = response.data[0];
                        console.log('_persistedData: %o', _persistedData);
                        $scope.hideLoading();
                        if (_.isFunction(done)) done.apply(null, [null, _persistedData]);
                    },
                    function failure() {
                        $scope.hideLoading();
                        $scope.showError('Failed to save pet info.');
                        console.error('failed to save formData');
                        if (_.isFunction(done)) done.apply(null, [new Error("Could not get pet")]);
                    }
                );
            };

            $scope.loadPet = function (props, done) {
                $scope.showLoading();
                $scope.getPet(props, function (err, petData) {
                    $scope.hideLoading();
                    if (err) {
                        $scope.showError('Failed to save pet info.');
                        console.log('failed to save formData');
                        if (_.isFunction(done)) done.apply(null, arguments);
                    } else {
                        console.log('_persistedData: %o', petData);
                        $scope.setPet(petData);
                        $scope.getPetList(function () {
                            $scope.hideLoading();
                            $mdToast.show($mdToast.simple().textContent('Pet loaded'));
                            if (_.isFunction(done)) done.apply(null, arguments);
                        });
                    }
                });
            };

            /**
             *
             * @param {Object} [petProps]
             * @param {Object} [options]
             * @param {Function} [options.done]
             * @param {Boolean} [options.setPetData=true]
             * @param {Boolean} [options.updatePetList=true]
             * @param {Boolean} [options.syncShelterMap=true]
             */
            $scope.savePet = function (petProps, options) {
                var _options = _.defaults(options, {
                    setPetData: true,
                    updatePetList: true,
                    syncShelterMap: true
                });
                $scope.showLoading();
                var data = petProps || $scope.petData,
                    formData = new FormData();
                console.log('sending photos %o', $scope.mediaInputEl.files);
                _.forEach($scope.mediaInputEl.files, function (file, index) {
                    formData.append("uploads", file);
                });
                var formattedPetData = dataParserService.convertDataToSaveFormat(data);
                console.log('saving petData %o', formattedPetData);
                _.forEach(formattedPetData, function (propValue, propName) {
                    formData.append(propName, propValue);
                });

                function savePetData() {
                    $http.post('/api/v1/save/' + formattedPetData.species, formData, {
                        headers: {
                            "Content-Type": undefined
                        }
                    }).then(
                        function success(response) {
                            var _persistedData = response.data;
                            console.log('_persistedData: %o', _persistedData);
                            if (_options.setPetData) {
                                $scope.setPet(_persistedData);
                            }
                            if (_options.updatePetList) {
                                $scope.getPetList(function () {
                                    $scope.hideLoading();
                                    $mdToast.show($mdToast.simple().textContent('Saved data!'));
                                    if (_.isFunction(_options.done)) _options.done.apply(null, [null, _persistedData]);
                                });
                            } else {
                                $scope.hideLoading();
                                $mdToast.show($mdToast.simple().textContent('Saved data!'));
                                if (_.isFunction(_options.done)) _options.done.apply(null, [null, _persistedData]);
                            }
                        },
                        function failure() {
                            $scope.hideLoading();
                            $scope.showError('Failed to save pet info.');
                            console.log('failed to save formData');
                            if (_.isFunction(_options.done)) _options.done.apply(null, [new Error("Could not save pet")]);
                        }
                    );
                }

                if (_options.syncShelterMap) {
                    $scope.syncShelterAddressMap(savePetData);
                } else {
                    savePetData()
                }
            };

            /**
             *
             * @param {Function} [complete]
             * @param {Object} [options]
             * @param {String} options.species
             */
            $scope.getPetList = function (complete, options) {
                $scope.showLoading();
                var _options = _.defaults(options, {
                        species: $scope.speciesList
                    }),
                    species = _options.species;

                function loadPetList(species, onPetListLoaded) {

                    $http.get("/api/v1/list/" + species + "?properties=['petId','petName','species','images']").then(
                        function success(response) {
                            $scope.hideLoading();
                            console.log('received pet list %O', response.data);
                            $scope.petList[species] = response.data;
                            if (onPetListLoaded) onPetListLoaded();
                        },
                        function failure() {
                            $scope.hideLoading();
                            $scope.showError('failed to download list of pets');
                            if (onPetListLoaded) onPetListLoaded(new Error('failed to download petList'));
                        })
                }

                if (_.isArray(_options.species)) {
                    async.each(_options.species,
                        function each(species, done) {
                            loadPetList(species, done);
                        }, function onAllPetListLoaded(err) {
                            if (complete) complete(err);
                        })
                } else {
                    loadPetList(species, complete);
                }
            };

            $scope.refreshPetData = function () {
                var searchProps = _.pick($scope.petData, ['petId', 'petName', 'species']),
                    _data = dataParserService.convertDataToSaveFormat(searchProps);

                console.log('_data; %o', _data);
                $scope.showLoading();
                $http.post('/api/v1/query', _data).then(
                    function success(response) {
                        $scope.hideLoading();
                        console.log(response.data);
                        if (
                            $scope.petData
                            && $scope.petData['petId']
                            && $scope.petData['petId'].val // only check for validity if we had already had a pet loaded
                            && !(_.isArray(response.data)
                            && response.data.length > 0
                            && response.data[0].petId
                            && response.data[0].petId.val)
                        ) {
                            $scope.hideLoading();
                            $scope.showError("Cannot refresh non-existent pet");
                            return;
                        }
                        var _persistedData = response.data[0];
                        console.log('_persistedData: %o', _persistedData);
                        $scope.setPet(dataParserService.convertToPetData(_persistedData));
                        $scope.$broadcast('update:petData');
                        $mdToast.show($mdToast.simple().textContent('Refreshed!'));
                    },
                    function failure() {
                        $scope.hideLoading();
                        $scope.showError();
                    }
                );
            };

            /**
             *
             * @param {Object} [options]
             * @param {Boolean} [options.idOnly]
             */
            $scope.clearPetData = function (options) {
                if (options && options.idOnly === true) {
                    if ($scope.petData) $scope.petData['petId'].val = null;
                } else {
                    for (var prop in $scope.petData) {
                        if ($scope.petData.hasOwnProperty(prop) && prop != 'species') {
                            $scope.petData[prop].val = null;
                        }
                    }
                }
            };


            /**
             *
             * @param callback
             * @param {Object} [options]
             * @param {Boolean} [options.useCache=false]
             */
            $scope.getSpeciesList = function (callback, options) {
                var _options = _.defaults(options, {
                    useCache: false
                });
                $scope.showLoading();
                if (_options.useCache && $scope.speciesList) {
                    $scope.hideLoading();
                    if (callback) callback(null, $scope.speciesList);
                } else {
                    $http.get('/api/v1/species/').then(
                        function success(response) {
                            $scope.hideLoading();
                            $scope.speciesList = response.data;
                            console.log('received species list %O', $scope.speciesList);
                            if (callback) callback(null, $scope.speciesList);
                        },
                        function failure() {
                            $scope.hideLoading();
                            $scope.showError('failed to download list of pets');
                            if (callback) callback(new Error('failed to download petList'));
                        })
                }
            };

            /**
             *
             * @param {Object} petModel
             */
            $scope.setPet = function (petModel) {
                var _petData = dataParserService.convertToPetData(petModel);
                console.log('setting data to %O', _petData);
                $scope.showLoading();
                _.forEach(_petData, function (propData, propName) {
                    $scope.petData[propName] = $scope.petData[propName] || {};
                    if (propData.val) $scope.petData[propName].val = propData.val;
                    if (propData.key) $scope.petData[propName].key = propData.key;
                    if (propData.defaultVal) $scope.petData[propName].defaultVal = propData.defaultVal;
                    if (propData.valType) $scope.petData[propName].valType = propData.valType;
                    if (propData.options) $scope.petData[propName].options = propData.options;
                });
                $scope.$broadcast('update:petData');
                $scope.hideLoading();
            };

            $scope.createOption = function (fieldName, val) {
                console.log(arguments);
                $scope.petData[fieldName].options.push(val);
                var _data = dataParserService.convertDataToModelFormat($scope.petData);
                console.log('_modelData; %o', _data);
                $scope.showLoading();
                $http.post('/api/v1/save/' + $scope.petData.species.val + '/model/', _data).then(
                    function success(response) {
                        var _persistedData = response.data,
                            _sanitizedData = dataParserService.convertToPetData(_persistedData);
                        console.log('persisted data: %o', _sanitizedData);
                        _.forEach(_sanitizedData, function (propData, propName) {
                            $scope.petData[propName].options = propData.options;
                        });
                        $scope.$broadcast('update:petData');
                        $scope.getPetList(function (err) {
                            $scope.hideLoading();
                            if (err) {
                                $scope.showError("Could not update after saving new option")
                            } else {
                                $mdToast.show($mdToast.simple().textContent('Saved!'));
                            }
                        });
                    },
                    function failure() {
                        $scope.hideLoading();
                        $scope.showError("Could not save new option");
                    }
                );

            };

            $scope.$watch('petData.species.val', function (newValue, oldValue) {
                console.log('petData.species.val: %s', newValue);
                var speciesIndex = _.indexOf($scope.speciesList, newValue);
                if (speciesIndex > -1) {
                    $scope.petData.species.val = newValue;
                    $scope.getModel($scope.petData.species.val, {useCache: true});
                    console.log('updating %s model', newValue);
                    $scope.petList.currentSpeciesIndex = speciesIndex;
                }
            });

            $scope.$on('change:tab', function (event, tab) {
                $scope.petData.species.val = tab;
                $scope.getModel($scope.petData.species.val);
            });

            $scope.$on('reload:app', function () {
                $scope.getPetList(function () {
                    $scope.refreshPetData();
                });
            });

            function init() {
                $scope.getSpeciesList(function () {
                    $scope.setField('species', _.extend({}, $scope.petData.species, {val: $scope.speciesList[0]}))
                });
            }

            init();

        }]);
});
