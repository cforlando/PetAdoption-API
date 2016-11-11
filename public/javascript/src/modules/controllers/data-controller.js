define([
    'require',
    'underscore',
    'async',
    'ngApp'
], function (require) {
    var ngApp = require('ngApp'),
        async = require('async'),
        _ = require('underscore');

    return ngApp.controller('dataController', [
        '$scope', 'request', '$mdToast', '$mdDialog', 'dataParser', '$routeParams', '$location', 'speciesFactory',
        function ($scope, request, $mdToast, $mdDialog, dataParser, $routeParams, $location, speciesFactory) {

            $scope.models = {};
            $scope.petList = {
                currentSpeciesIndex: 0
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

                    request.get("/api/v1/list/" + species + "?properties=['petId','petName','species','images']").then(
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
                    request.get('/api/v1/species/').then(
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
             * @param {String} species
             * @param {Object} [options]
             * @param {Function} [options.callback]
             * @param {Boolean} [options.useCache=false]
             */
            $scope.getSpecies = function (species, options) {
                var _options = _.defaults(options, {
                    useCache: false
                });
                console.log('$scope.getModel(%o)', _options);
                $scope.showLoading();
                if (_options.useCache && $scope.models[species]) {
                    $scope.hideLoading();
                    if (_options.callback) _options.callback(null, $scope.models[species]);
                } else {

                    request.get('/api/v1/model/' + species).then(function success(response) {
                            $scope.hideLoading();
                            $mdToast.show($mdToast.simple().textContent("Successfully fetched " + species + " model"));
                            $scope.models[species] = dataParser.convertDataToSpeciesFormat(response.data);
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
             * @param {String} speciesName
             * @param {Object} speciesData
             * @param {Object} [options]
             * @param {Function} options.done
             */
            $scope.saveSpecies = function (speciesName, speciesData, options) {
                $scope.showLoading();
                var _options = _.defaults(options, {});

                request.post('/api/v1/save/' + speciesName + '/model/', speciesData).then(
                    function success(response) {
                        var _persistedData = response.data;
                        $scope.models[speciesName] = dataParser.convertDataToSpeciesFormat(_persistedData);
                        $scope.hideLoading();
                        if (_options.done) _options.done(null, $scope.models[speciesName]);
                    },
                    function failure() {
                        $scope.hideLoading();
                        $scope.showError("Could not save " + speciesName);
                        if (_options.done) _options.done(new Error("Could not save model"));
                    });
            };

            /**
             *
             * @param {String} speciesName
             * @param {Object} [options]
             * @param {Function} [options.done]
             */
            $scope.createSpecies = function (speciesName, options) {
                $scope.showLoading();
                var sanitizedSpeciesName = _.kebabCase(speciesName),
                    _options = _.defaults(options, {
                        speciesProps: []
                    });
                if ($scope.models[sanitizedSpeciesName]) {
                    if (_options.done) _options.done(null, $scope.models[sanitizedSpeciesName]);
                } else {
                    var newSpecies = speciesFactory.createTemplate(sanitizedSpeciesName);
                    request.post('/api/v1/create/' + sanitizedSpeciesName + '/model', newSpecies.getProps())
                        .then(
                            function success(response) {
                                $scope.hideLoading();
                                var speciesProps = response.data;
                                $scope.models[sanitizedSpeciesName] = speciesProps;
                                $scope.getSpeciesList(function (err, speciesList) {
                                    if (err) {
                                        console.error(err);
                                        $scope.showError('Could not create species');
                                        if (_options.done) _options.done(err);
                                    } else {
                                        if (_options.done) _options.done(null, speciesProps);
                                    }
                                })
                            },
                            function failure(err) {
                                $scope.hideLoading();
                                console.error(err);
                                $scope.showError('Could not create species');
                                if (_options.done) _options.done(err);
                            }
                        )
                }
            };

            /**
             *
             * @param {String} speciesName
             * @param {Object} [options]
             * @param {Function} options.done
             */
            $scope.deleteSpecies = function (speciesName, options) {
                var _options = _.defaults(options, {});
                $scope.showLoading();

                request.post('/api/v1/remove/' + speciesName + '/model').then(
                    function success(response) {
                        $scope.hideLoading();
                        $scope.showMessage('Deleted ' + speciesName);
                        $scope.getSpeciesList(function (err) {
                            if (err) console.error(err);
                            if (_options.done) _options.done(null, response);
                        }, {useCache: false});
                    },
                    function failure() {
                        $scope.hideLoading();
                        var errMessage = "Could not delete " + speciesName;
                        $scope.showError(errMessage);
                        if (_options.done) _options.done(new Error(errMessage));
                    }
                );
            };


            /**
             *
             * @param {String} speciesName
             * @param {String} propName
             * @param {Object} [options]
             * @param {Function} options.done
             */
            $scope.deleteSpeciesProp = function (speciesName, propName, options) {
                $scope.models[speciesName] = _.reject($scope.models[speciesName], {key: propName});
                $scope.saveSpecies(speciesName, $scope.models[speciesName], options);
            };

            /**
             *
             * @param {String|Object} species
             * @param {String} propName
             */
            $scope.getSpeciesProp = function (species, propName) {
                var speciesData;
                if (_.isString(species)) {
                    speciesData = $scope.models[species];
                } else {
                    speciesData = species;
                }
                return _.find(speciesData, {key: propName});
            };

            /**
             *
             * @param {String|Object[]} species
             * @param {Object} propData
             */
            $scope.setSpeciesProp = function (species, propData) {
                var propIndex,
                    speciesData;
                if (_.isString(species)) {
                    speciesData = $scope.models[species];
                } else {
                    speciesData = species;
                }
                propIndex = _.findIndex(speciesData, {key: propData.key});
                if (propIndex > -1) {
                    speciesData[propIndex] = propData;
                } else {
                    speciesData.push(propData)
                }
            };

            /**
             *
             * @param {String} speciesName
             * @param {String} propName
             */
            $scope.addSpeciesProp = function (speciesName, propName) {

                if ($scope.getSpeciesProp(speciesName, propName)) {
                    $scope.showMessage('Property already exists');
                } else {
                    $scope.models[speciesName].push({
                        key: propName,
                        valType: 'String',
                        defaultVal: '',
                        fieldLabel: '',
                        note: '',
                        description: '',
                        example: '',
                        options: []
                    });
                }
            };


            /**
             *
             * @param {Object} petData
             */
            $scope.editPet = function (petData) {
                $location.path('/animals/edit/' + petData.species.val + '/' + petData.petId.val);
            };

            /**
             *
             * @param {Object} petData
             */
            $scope.loadPet = function (petData) {
                $scope.getPet(petData, {
                    done: function (err, responsePetData) {
                        $scope.activeData = responsePetData;
                    }
                });
            };

            /**
             *
             * @param {Object} petData
             * @param {Object} [options]
             * @param {Function} [options.done]
             */
            $scope.deletePet = function (petData, options) {
                var data = petData,
                    _options = _.defaults(options, {
                        showSuccessNotification: true
                    });
                $scope.showLoading();
                var formattedData = dataParser.convertDataToSaveFormat(data);
                console.log('_data; %o', formattedData);

                request.post('/api/v1/remove/' + formattedData.species, formattedData).then(
                    function success(response) {
                        $scope.hideLoading();
                        if (_options.showSuccessNotification) $scope.showMessage('Deleted!');
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
             * @param {Boolean} [options.showNotifications]
             * @param {Function} [options.done]
             */
            $scope.getPet = function (petData, options) {
                var _options = _.defaults(options, {
                        showSuccessNotification: true
                    }),
                    searchProps = _.pick(petData, ['petId', 'petName', 'species']),
                    queryData = dataParser.convertDataToSaveFormat(searchProps);

                console.log('queryData; %o', queryData);
                $scope.showLoading();
                request.post('/api/v1/query/', dataParser.convertDataToSaveFormat(petData)).then(
                    function success(response) {
                        $scope.hideLoading();
                        var _persistedData = response.data[0];
                        console.log('_persistedData: %o', _persistedData);
                        if(_options.showSuccessNotification) $scope.showMessage('Successfully fetched pet info.');
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
             * @param {Function} [options.isMediaSaved]
             * @param {Function} [options.done]
             */
            $scope.savePet = function (petProps, options) {
                $scope.showLoading();
                var _options = _.defaults(options, {}),
                    formData = new FormData();
                if (petProps.$media) {
                    // append uploaded files
                    petProps.$media.each(function(){
                        var fileInputEl = this;
                        console.log('appending photos to save request: %o', fileInputEl.files);
                        _.forEach(fileInputEl.files, function (file, index) {
                            formData.append('uploads', file);
                            // TODO only append if filename is saved in props
                        });
                    });
                    // we won't be needing the $media anymore - no sense in trying to format it
                    delete petProps.$media;
                }

                var formattedPetData = dataParser.convertDataToSaveFormat(petProps);
                console.log('saving petData %o', formattedPetData);

                _.forEach(formattedPetData, function (propValue, propName) {
                    if (propValue) formData.append(propName, propValue);
                });

                request.post('/api/v1/save/' + formattedPetData.species, formData, {
                    headers: {
                        "Content-Type": undefined
                    }
                }).then(
                    function success(response) {
                        $scope.hideLoading();
                        var _persistedData = response.data;
                        console.log('_persistedData: %o', _persistedData);
                        $scope.showMessage('Pet saved');
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


            function init() {
                $scope.getSpeciesList(function (err, speciesList) {
                    $scope.getPetList(speciesList, {
                        done: function (err) {

                        }
                    });
                });
            }

            init();

        }
    ]);
});
