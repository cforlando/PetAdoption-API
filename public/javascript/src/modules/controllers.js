define([
    'require',
    'underscore',
    'ngApp'
], function (require) {
    var ngApp = require('ngApp'),
        _ = require('underscore');

    var petDataController = ngApp.controller('petDataController', ['$scope', '$http', '$mdToast', 'dataParserService',
        function ($scope, $http, $mdToast, dataParserService) {
            $scope.petData = {};
            $scope.visiblePetType = 'cat';

            function updateModel(done) {
                $http.get('/api/v1/model/' + $scope.visiblePetType).then(
                    function success(response) {
                        $mdToast.show($mdToast.simple().textContent("Successfully updated from server."));
                        var parsedResponseData = dataParserService.parseResponseData(response.data);
                        _.extend($scope['petData'], parsedResponseData);
                        if (done) done($scope['petData']);
                    },
                    function failure() {
                        $mdToast.show($mdToast.simple().textContent("Sorry. Can't get any info from server."));
                        if (done) done(null);
                    });
            }

            updateModel();

            $scope['fab'] = {
                isOpen: false
            }
        }]);

    console.log('init controllers');

    return petDataController;
});