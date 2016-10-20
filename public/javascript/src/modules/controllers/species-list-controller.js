define([
    'require',
    'underscore',
    'text!modules/views/dialogs/new-species.html',
    'ngApp'
], function (require) {
    var ngApp = require('ngApp'),
        _ = require('underscore');

    ngApp.controller('speciesListController', [
        '$scope', '$mdDialog', '$location',
        function ($scope, $mdDialog, $location) {

            $scope.createNewProp = function (evt) {

                $mdDialog.show({
                    template: require('text!modules/views/dialogs/new-species.html'),
                    targetEvent: evt,
                    clickOutsideToClose: true,
                    controller: ['$scope', '$mdDialog', function ($scope, $mdDialog) {
                        console.log('init $mdDialog w/ $scope', $scope);
                        $scope.save = function () {
                            $mdDialog.hide(_.kebabCase($scope.speciesName));
                        };

                        $scope.hide = function () {
                            $mdDialog.cancel();
                        }
                    }]
                }).then(
                    function onConfirm(propName) {
                        console.log('confirmed: %o', arguments);
                        $scope.createSpecies(propName, {
                            done: function (err, speciesProps) {
                                if (err) {
                                    console.error(err);
                                } else {
                                    $location.path('species/' + propName);
                                }
                            }
                        });
                    }, function onCancel() {
                        console.log('cancelled: %o', arguments);
                    });

            };
        }]);

});
