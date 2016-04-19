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
            $scope.visiblePetType = angular.element('md-tab').first().attr('label');

            /**
             *
             * @param {Function} [done]
             */
            function updateModel(done) {
                $scope.showLoading();
                $http.get('/api/v1/model/' + $scope.visiblePetType).then(
                    function success(response) {
                        $mdToast.show($mdToast.simple().textContent("Successfully updated from server."));
                        var parsedResponseData = dataParserService.parseResponseData(response.data);
                        $scope.petData[$scope.visiblePetType] = _.extend(parsedResponseData, $scope.petData[$scope.visiblePetType]);
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
                var _data = dataParserService.formatSendData($scope.petData[$scope.visiblePetType]);
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

            $scope.savePet = function () {
                var _data = dataParserService.formatSendData($scope.petData[$scope.visiblePetType]);

                console.log('_data; %o', _data);
                $scope.showLoading();
                $http.post('/api/v1/save', _data).then(
                    function success(response) {
                        if (response.data.result != 'success') {
                            $scope.showError();
                            return;
                        }
                        var _persistedData = response.data['data'];
                        console.log('_persistedData: %o', _persistedData);
                        $scope.petData[$scope.visiblePetType] = dataParserService.parseResponseData(_persistedData);
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
                    _data = dataParserService.formatSendData(searchProps);

                console.log('_data; %o', _data);
                $scope.showLoading();
                $http.post('/api/v1/query', _data).then(
                    function success(response) {
                        console.log(response.data);
                        if (!(_.isArray(response.data) &&
                            response.data.length > 0 &&
                            response.data[0].petId &&
                            response.data[0].petId.val)) {
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
                var _petData = dataParserService.parseResponseData(petModel);
                _.forEach(_petData, function (petPropData, petPropName) {
                    if ($scope.petData[$scope.visiblePetType][petPropName] && petPropData.val) {
                        $scope.petData[$scope.visiblePetType][petPropName].val = petPropData.val;
                    }
                });
            };

            $scope.$on('tabSelected', function (event, tab) {
                $scope.visiblePetType = tab;
                updateModel();
            });

            $scope.$on('refreshApp', function () {
                $scope.getPetList(function () {
                    $scope.refreshPetData();
                });
            });
        }]);

});