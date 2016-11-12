define([
    'require',
    'angular',
    'underscore',
    'modules/controllers/form-controller',
    'text!modules/views/dialogs/new-species-prop.html',
    'ngApp'
], function (require) {
    var angular = require('angular'),
        ngApp = require('ngApp'),
        _ = require('underscore');

    return ngApp.controller("speciesFormController", [
        '$scope', '$routeParams', '$location', '$mdDialog', '$controller', 'request',
        function ($scope, $routeParams, $location, $mdDialog, $controller, request) {
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
                    label: 'Delete'
                },
                {
                    onClick: function () {
                        $scope.$fileInputScope.upload({
                            isSingle: true
                        });
                    },
                    icon: 'photo',
                    label: 'Placeholder'
                }
            ];


            $scope.registerMediaScope = function($fileInputScope){
                $scope.$fileInputScope = $fileInputScope;
            };

            /**
             *
             * @param {String} speciesName
             * @param {HTMLElement} fileInput
             * @param {Object} [options]
             */
            $scope.saveSpeciesPlaceholder = function(speciesName, fileInput, options){
                $scope.showLoading();
                var _options = _.defaults(options, {}),
                    formData = new FormData();

                _.forEach(fileInput.files, function(file){
                    formData.append("uploads", file);
                });

                request.post('/api/v1/save/' + speciesName + '/placeholder', formData, {
                    headers: {
                        "Content-Type": undefined
                    }
                }).then(
                    function success(response){
                        $scope.hideLoading();
                        $scope.showMessage("Saved placeholder");
                        if(_options.done) _options.done();
                    },
                    function failure(){
                        $scope.hideLoading();
                        var errMessage = "Could not save placeholder";
                        $scope.showError(errMessage);
                        if(_options.done) _options.done(new Error(errMessage));
                    }
                )
            };

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
                $scope.$on('file-input:change', function ($evt, $mediaFormScope) {
                    console.log("on('file-input:set'): %o", arguments);
                    $scope.$apply(function () {
                        $scope.saveSpeciesPlaceholder($scope.speciesName, $mediaFormScope.get$inputs()[0], {
                            done: function(err){
                                if (err) console.error(err);
                            }
                        });
                    });
                });

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
