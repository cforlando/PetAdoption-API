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
            $scope.petList = {
                currentSpeciesIndex: 0
            };
            $scope.formScopes = {
                registered: []
            };


            /**
             *
             * @param {String} species
             * @param {Object} [options]
             * @param {Function} [options.callback]
             * @param {Boolean} [options.useCache=false]
             */
            $scope.getModel = function (species, options) {
                var _options = _.defaults(options, {
                    useCache: false,
                });
                console.log('$scope.getModel(%o)', _options);
                $scope.showLoading();
                if (_options.useCache && $scope.models[species]) {
                    $scope.hideLoading();
                    if (_options.callback) _options.callback(null, $scope.models[species]);
                } else {

                    $http.get('/api/v1/model/' + species).then(function success(response) {
                            $scope.hideLoading();
                            $mdToast.show($mdToast.simple().textContent("Successfully fetched " + species + " model"));
                            var parsedResponseData = dataParserService.convertToPetData(response.data);
                            $scope.models[species] = _.extend({}, $scope.models[species], parsedResponseData);
                            if (_options.callback) _options.callback(null, $scope.models[species]);
                        },
                        function failure() {
                            $scope.hideLoading();
                            $mdToast.show($mdToast.simple().textContent("Sorry. Can't get any info from server."));
                            if (_options.callback) _options.callback(new Error("Could not fetch model"));
                        });
                }
            };


            /**
             *
             * @param {Object} petData
             * @param {Object} [options]
             * @param {Function} [options.done]
             */
            $scope.deletePet = function (petData, options) {
                var data = petData,
                    _options = _.defaults(options, {});
                $scope.showLoading();
                var formattedData = dataParserService.convertDataToSaveFormat(data);
                console.log('_data; %o', formattedData);

                $http.post('/api/v1/remove/' + formattedData.species, formattedData).then(
                    function success(response) {
                        $scope.hideLoading();
                        $scope.showMessage('Deleted!');
                        if (_options.done) _options.done(null, response);
                    },
                    function failure() {
                        $scope.hideLoading();
                        $scope.showError("Could not delete pet");
                        if (_options.done) _options.done(new Error('Could not delete pet'));
                    }
                );
            };

            /**
             *
             * @param {Object} petData
             * @param {Object} [options]
             * @param {Function} [options.done]
             */
            $scope.getPet = function (petData, options) {
                var _options = _.defaults(options, {}),
                    searchProps = _.pick(petData, ['petId', 'petName', 'species']),
                    queryData = dataParserService.convertDataToSaveFormat(searchProps);

                console.log('queryData; %o', queryData);
                $scope.showLoading();
                $http.post('/api/v1/query/', dataParserService.convertDataToSaveFormat(petData)).then(
                    function success(response) {
                        $scope.hideLoading();
                        var _persistedData = response.data[0];
                        console.log('_persistedData: %o', _persistedData);
                        $scope.showError('Successfully fetched pet info.');
                        if (_.isFunction(_options.done)) _options.done.apply(null, [null, _persistedData]);
                    },
                    function failure() {
                        $scope.hideLoading();
                        $scope.showError('Failed to get pet info.');
                        console.error('failed to save formData');
                        if (_.isFunction(_options.done)) _options.done.call(null, new Error("Could not get pet"));
                    }
                );
            };

            /**
             *
             * @param {Object} petProps
             * @param {Object} [options]
             * @param {Function} [options.done]
             */
            $scope.savePet = function (petProps, options) {
                $scope.showLoading();
                var _options = _.defaults(options, {}),
                    data = petProps,
                    formData = new FormData();
                console.log('sending photos %o', petProps.imageFiles);
                _.forEach(petProps.imageFiles, function (file, index) {
                    formData.append("uploads", file);
                });
                var formattedPetData = dataParserService.convertDataToSaveFormat(data);
                console.log('saving petData %o', formattedPetData);
                _.forEach(formattedPetData, function (propValue, propName) {
                    if (propValue) formData.append(propName, propValue);
                });

                $http.post('/api/v1/save/' + formattedPetData.species, formData, {
                    headers: {
                        "Content-Type": undefined
                    }
                }).then(
                    function success(response) {
                        $scope.hideLoading();
                        var _persistedData = response.data;
                        console.log('_persistedData: %o', _persistedData);
                        if (_.isFunction(_options.done)) _options.done.apply(null, [null, _persistedData]);
                    },
                    function failure() {
                        $scope.hideLoading();
                        $scope.showError('Failed to save pet info.');
                        console.error('failed to save formData');
                        if (_.isFunction(_options.done)) _options.done.apply(null, [new Error("Could not save pet")]);
                    }
                );

            };

            /**
             *
             * @param {*} [species]
             * @param {Object} [options]
             * @param {Function} [options.done]
             */
            $scope.getPetList = function (species, options) {
                $scope.showLoading();
                var _options = _.defaults(options, {}),
                    requestedSpecies = species || $scope.speciesList;

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

                if (_.isArray(requestedSpecies)) {
                    async.each(requestedSpecies,
                        function each(species, done) {
                            loadPetList(species, done);
                        },
                        function onAllPetListLoaded(err) {
                            if (_options.done) _options.done(err);
                        })
                } else {
                    loadPetList(requestedSpecies, _options.done);
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


            $scope.saveModel = function (petData, options) {
                $scope.showLoading();
                var _options = _.defaults(options, {}),
                    modelData = dataParserService.convertDataToModelFormat(petData);
                $http.post('/api/v1/save/' + petData.species.val + '/model/', modelData).then(
                    function success(response) {
                        var _persistedData = response.data,
                            _sanitizedData = dataParserService.convertToPetData(_persistedData);
                        console.log('persisted data: %o', _sanitizedData);
                        _.forEach(_sanitizedData, function (propData, propName) {
                            petData[propName].options = propData.options;
                        });
                        $scope.hideLoading();
                        if (_options.done) _options.done(null, petData);
                    },
                    function failure() {
                        $scope.hideLoading();
                        $scope.showError("Could not save new option");
                        if (_options.done) _options.done(new Error("Could not save model"));
                    });
            };

            $scope.loadPet = function (petData) {
                _.forEach($scope.formScopes.registered, function ($formScope) {
                    $scope.getPet(petData, {
                        done: function (err, responsePetData) {
                            $formScope.setPet(responsePetData);
                        }
                    })
                });
            };


            $scope.registerForm = function ($formScope) {
                $scope.formScopes.registered.push($formScope);
            };

            function init() {
                $scope.getSpeciesList(function (err, speciesList) {
                    $scope.getPetList(speciesList, {
                        done: function (err) {
                            _.forEach($scope.formScopes.registered, function ($formScope) {
                                $formScope.setField('species', _.extend({}, $formScope.petData.species, {
                                    val: speciesList[0]
                                }))
                            });
                        }
                    });
                });
            }

            init();

        }
    ]);
});