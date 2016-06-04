define([
    'require',
    'underscore',
    'ngApp'
], function (require) {
    var ngApp = require('ngApp'),
        _ = require('underscore');

    return ngApp.controller('petDataController', ['$scope', '$http', '$mdToast', 'dataParserService',
        function ($scope, $http, $mdToast, dataParserService) {
            $scope.petData = {};
            $scope.mediaInputEl = {files: []}; // stub in case el is never defined
            $scope.visiblePetType = angular.element('md-tab').first().attr('label');

            /**
             *
             * @param {Function} [done]
             */
            function updateModelFromServer(done) {
                $scope.showLoading();
                $http.get('/api/v1/model/' + $scope.visiblePetType).then(
                    function success(response) {
                        $mdToast.show($mdToast.simple().textContent("Successfully updated from server."));
                        var parsedResponseData = dataParserService.parseResponseData(response.data);
                        $scope.petData[$scope.visiblePetType] = _.extend($scope.petData[$scope.visiblePetType], parsedResponseData);
                        $scope.hideLoading();
                        if (done) done($scope.petData[$scope.visiblePetType]);
                    },
                    function failure() {
                        $scope.hideLoading();
                        $mdToast.show($mdToast.simple().textContent("Sorry. Can't get any info from server."));
                        if (done) done(null);
                    });
            }

            $scope.deletePet = function () {
                $scope.showLoading();
                var _data = dataParserService.convertDataToSaveFormat($scope.petData[$scope.visiblePetType]);
                console.log('_data; %o', _data);

                $http.post('/api/v1/remove', _data).then(
                    function success(response) {
                        if (response.data.result != 'success') {
                            $scope.hideLoading();
                            $scope.showError();
                            return;
                        }
                        $scope.clearPetData();
                        $scope.getPetList(function () {
                            $scope.hideLoading();
                            $mdToast.show($mdToast.simple().textContent('Deleted!'));
                        });

                    },
                    function failure() {
                        $scope.hideLoading();
                        $scope.showError()
                    }
                );
            };

            $scope.savePetJSON = function () {
                var _data = dataParserService.convertDataToSaveFormat($scope.petData[$scope.visiblePetType]);
                console.log('_data; %o', _data);
                $scope.showLoading();

                $http.post('/api/v1/save', _data).then(
                    function success(response) {
                        if (response.data.result != 'success') {
                            $scope.hideLoading();
                            $scope.showError();
                            return;
                        }
                        var _persistedData = response.data['data'];
                        console.log('_persistedData: %o', _persistedData);
                        $scope.petData[$scope.visiblePetType] = dataParserService.parseResponseData(_persistedData);
                        $scope.getPetList(function () {
                            $scope.hideLoading();
                            $mdToast.show($mdToast.simple().textContent('Saved data!'));
                        });
                    },
                    function failure() {
                        $scope.hideLoading();
                        $scope.showError();
                    }
                );
                $scope.$broadcast('save:petData');
            };

            $scope.savePet = function (done) {
                $scope.showLoading();
                var _data = new FormData();
                console.log('sending photos %o', $scope.mediaInputEl.files);
                _.forEach($scope.mediaInputEl.files, function (file, index) {
                    _data.append("uploads", file);
                });
                var _petData = dataParserService.convertDataToSaveFormat($scope.petData[$scope.visiblePetType]);
                console.log('saving petData %o', _petData);
                _.forEach(_petData, function (propValue, propName) {
                    if (propValue) _data.append(propName, propValue)
                });

                $http.post('/api/v1/save', _data, {
                    headers: {
                        "Content-Type": undefined
                    }
                }).then(
                    function success(response) {
                        if (response.data.result != 'success') {
                            $scope.hideLoading();
                            $scope.showError();
                            if (_.isFunction(done)) done.apply(null, arguments);
                            return;
                        }
                        var _persistedData = response.data['data'];
                        console.log('_persistedData: %o', _persistedData);
                        $scope.petData[$scope.visiblePetType] = dataParserService.parseResponseData(_persistedData);
                        $scope.getPetList(function () {
                            $scope.hideLoading();
                            $mdToast.show($mdToast.simple().textContent('Saved data!'));
                            if (_.isFunction(done)) done.apply(null, arguments);
                        });
                    },
                    function failure() {
                        $scope.hideLoading();
                        $mdToast.show($mdToast.simple().textContent('Failed to save.'));
                        console.log('failed to save formData');
                        if (_.isFunction(done)) done.apply(null, arguments);
                    }
                );
            };

            /**
             *
             * @param {Function} [done]
             */
            $scope.getPetList = function (done) {
                $scope.showLoading();
                $http.get('/api/v1/list/' + $scope.visiblePetType).then(
                    function success(response) {
                        console.log('received pet list %O', response.data);
                        $scope.petList = response.data;
                        $scope.hideLoading();
                        if (done) done();
                    },
                    function failure() {
                        if (done) done(new Error('failed to download petList'));
                        $scope.hideLoading();
                    })
            };

            $scope.refreshPetData = function () {
                var searchProps = _.pick($scope.petData[$scope.visiblePetType], ['petId', 'petName']),
                    _data = dataParserService.convertDataToSaveFormat(searchProps);

                console.log('_data; %o', _data);
                $scope.showLoading();
                $http.post('/api/v1/query', _data).then(
                    function success(response) {
                        console.log(response.data);
                        if (
                            $scope.petData[$scope.visiblePetType]
                            && $scope.petData[$scope.visiblePetType]['petId']
                            && $scope.petData[$scope.visiblePetType]['petId'].val // only check for validity if we had already had a pet loaded
                            && !(_.isArray(response.data)
                            && response.data.length > 0
                            && response.data[0].petId
                            && response.data[0].petId.val)
                        ) {
                            $scope.hideLoading();
                            $scope.showError();
                            return;
                        }
                        var _persistedData = response.data[0];
                        console.log('_persistedData: %o', _persistedData);
                        $scope.petData[$scope.visiblePetType] = dataParserService.parseResponseData(_persistedData);
                        $scope.hideLoading();
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
                    if ($scope.petData[$scope.visiblePetType]) $scope.petData[$scope.visiblePetType]['petId'].val = null;
                } else {
                    for (var prop in $scope.petData[$scope.visiblePetType]) {
                        if ($scope.petData[$scope.visiblePetType].hasOwnProperty(prop)) {
                            $scope.petData[$scope.visiblePetType][prop].val = null;
                        }
                    }
                }
            };

            /**s
             *
             * @param {Object} petModel
             */
            $scope.setPet = function (petModel) {
                console.log('setting data to %O', petModel);
                var _petData = dataParserService.parseResponseData(petModel);
                _.forEach(_petData, function (petPropData, petPropName) {
                    if ($scope.petData[$scope.visiblePetType][petPropName]) {
                        if(petPropData.val) $scope.petData[$scope.visiblePetType][petPropName].val = petPropData.val;
                        if(petPropData.key) $scope.petData[$scope.visiblePetType][petPropName].key = petPropData.key;
                        if(petPropData.defaultVal) $scope.petData[$scope.visiblePetType][petPropName].defaultVal = petPropData.defaultVal;
                        if(petPropData.valType) $scope.petData[$scope.visiblePetType][petPropName].valType = petPropData.valType;
                        if(petPropData.options) $scope.petData[$scope.visiblePetType][petPropName].options = petPropData.options;
                    }
                });
            };

            $scope.createOption = function(petType, fieldName, val){
                console.log(arguments);
                $scope.petData[$scope.visiblePetType][fieldName].options.push(val);
                var _data = dataParserService.convertDataToModelFormat($scope.petData[$scope.visiblePetType]);
                console.log('_data; %o', _data);
                $scope.showLoading();
                $http.post('/api/v1/save/model/', _data).then(
                    function success(response) {
                        if (response.data.result != 'success') {
                            $scope.hideLoading();
                            $scope.showError();
                            return;
                        }
                        var _persistedData = response.data['data'],
                            _sanitizedData = dataParserService.parseResponseData(_persistedData);
                        console.log('persisted data: %o', _sanitizedData);
                        _.forEach(_sanitizedData, function(propData, propName){
                            $scope.petData[$scope.visiblePetType][propName].options = propData.options;
                        });
                        $scope.getPetList(function () {
                            $scope.hideLoading();
                            $mdToast.show($mdToast.simple().textContent('Saved!'));
                        });
                    },
                    function failure() {
                        $scope.hideLoading();
                        $scope.showError();
                    }
                );

            };

            $scope.$on('change:tab', function (event, tab) {
                $scope.visiblePetType = tab;
                updateModelFromServer();
            });

            $scope.$on('reload:app', function () {
                $scope.getPetList(function () {
                    $scope.refreshPetData();
                });
            });
        }]);

});
