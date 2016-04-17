define([
    'require',
    'underscore',
    'ngApp'
], function (require) {
    var ngApp = require('ngApp'),
        _ = require('underscore');

    return ngApp.controller('petDataController', ['$scope', '$http', '$mdToast', 'dataParserService',
        function ($scope, $http, $mdToast, dataParserService) {
            $scope.sideNav = {
                isOpen: false
            };
            $scope.fab = {
                isOpen: false
            };
            $scope.petData = {};
            $scope.visiblePetType = 'cat';

            function updateModel(done) {
                $http.get('/api/v1/model/' + $scope.visiblePetType).then(
                    function success(response) {
                        $mdToast.show($mdToast.simple().textContent("Successfully updated from server."));
                        var parsedResponseData = dataParserService.parseResponseData(response.data);
                        $scope.petData[$scope.visiblePetType] = _.extend(parsedResponseData, $scope.petData[$scope.visiblePetType]);
                        if (done) done($scope.petData[$scope.visiblePetType]);
                    },
                    function failure() {
                        $mdToast.show($mdToast.simple().textContent("Sorry. Can't get any info from server."));
                        if (done) done(null);
                    });
            }

            $scope.toggleMenu = function ($mdOpenMenu, ev) {
                $mdOpenMenu(ev);
            };

            $scope.refreshApp = function () {
                console.log('refreshing');
                // updateModel();
            };

            $scope.onTabSelected = function (tab) {
                console.log('tab selected: %s', tab);
                $scope.visiblePetType = tab;
                updateModel();
            };

            $scope.getPetList = function () {
                $http.get('/api/v1/list/' + $scope.visiblePetType).then(
                    function success(response) {
                        console.log('received pet list %O', response.data);
                        $scope.petList = response.data;
                    },
                    function failure() {

                    })
            };

            $scope.setPet = function (petModel) {
                var _petData = dataParserService.parseResponseData(petModel);
                _.forEach(_petData, function (petPropData, petPropName) {
                    if ($scope.petData[$scope.visiblePetType][petPropName] && petPropData.val) {
                        $scope.petData[$scope.visiblePetType][petPropName].val = petPropData.val;
                    }
                });
            };
        }]);

});