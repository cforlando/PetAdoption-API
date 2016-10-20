define([
    'require',
    'underscore',
    'modules/controllers/form-controller',
    'text!modules/views/dialogs/new-species-prop.html',
    'ngApp'
], function (require) {
    var ngApp = require('ngApp'),
        _ = require('underscore');

    return ngApp.controller("speciesFormController", [
        '$scope', '$routeParams', '$location', '$mdDialog', '$controller',
        function ($scope, $routeParams, $location, $mdDialog, $controller) {
            angular.extend(this, $controller('formController', {$scope: $scope}));
            $scope.valTypes = ['String', 'Date', 'Number', 'Boolean'];
            $scope.speciesName = $routeParams.speciesName;
            $scope.actionMenu.actions = [
                {
                    onClick: function () {
                        $scope.deleteSpecies($scope.speciesName, {
                            done: function () {
                                $location.path('/species');
                            }
                        })
                    },
                    icon: 'delete_forever',
                    label: 'Delete Species'
                }
            ];


            $scope.editProp = function (propData) {
                $location.path('species/' + $scope.speciesName + '/' + propData.key);
            };

            $scope.deleteProp = function (propData) {
                console.log('deleting %s', propData.key);
                var confirmationDialog = $mdDialog.confirm()
                    .title("Delete Confirmation")
                    .textContent("Delete '" + propData.key + "'?")
                    .ok('Yes')
                    .cancel('No');

                $mdDialog.show(confirmationDialog).then(
                    function onConfirm() {
                        $scope.deleteSpeciesProp($scope.speciesName, propData.key, {
                            done: function () {
                                $scope.showMessage("Deleted '" + propData.key + "'");
                                $location.path('/species/' + $scope.speciesName);
                            }
                        })
                    }, function onCancel() {
                        console.log('cancelled');
                    });
            };

            $scope.createNewProp = function (evt) {

                $mdDialog.show({
                    template: require('text!modules/views/dialogs/new-species-prop.html'),
                    targetEvent: evt,
                    clickOutsideToClose: true,
                    controller: ['$scope', '$mdDialog', function ($scope, $mdDialog) {
                        console.log('init $mdDialog w/ $scope', $scope);
                        $scope.save = function () {
                            $mdDialog.hide(_.camelCase($scope.propName));
                        };

                        $scope.hide = function () {
                            $mdDialog.cancel();
                        }
                    }]
                }).then(
                    function onConfirm(propName) {
                        console.log('confirmed: %o', arguments);
                        $scope.addSpeciesProp($scope.speciesName, propName);
                        $location.path('species/' + $scope.speciesName + '/' + propName);
                    }, function onCancel() {
                        console.log('cancelled: %o', arguments);
                    });

            };


            $scope.isEditableProp = function (propData) {
                var unchangeables = {
                    keys: [],
                    valTypes: []
                };
                return !(_.includes(unchangeables.keys, propData.key) || _.includes(unchangeables.valTypes, propData.valType));
            };

            $scope.isVisibleProp = function (propData) {
                var invisibles = {
                    keys: [
                        'petId',
                        'species'
                    ],
                    valTypes: [
                        '[Image]',
                        'Location'
                    ]
                };
                return !(_.includes(invisibles.keys, propData.key) || _.includes(invisibles.valTypes, propData.valType));
            };

            function init() {
                $scope.getSpecies($scope.speciesName, {
                    useCache: true,
                    callback: function (err, model) {
                        if (err) {
                            $scope.showError("Could not load '" + $scope.speciesName + "'")
                        } else {
                        }
                    }
                })
            }

            init();

        }])
});
