var ngApp = require('ngApp');
var _ = require('lodash');

module.exports = ngApp.directive('speciesList', function () {
    return {
        restrict: 'C',
        template: require('raw!./templates/species-list.html'),
        controller: function ($scope, $mdDialog, $location, speciesDataService) {


            $scope.createNewSpecies = function (evt) {
                var newSpeciesDialogParams = {
                    template: require('raw!modules/views/dialogs/new-species.html'),
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
                };
                var newSpeciesName;

                return $mdDialog.show(newSpeciesDialogParams)
                    .then(function onConfirm(speciesName) {
                        console.log('confirmed: %o', arguments);
                        newSpeciesName = speciesName;
                        return $scope.createSpecies(newSpeciesName);
                    })
                    .then(function () {
                        $location.path('species/' + newSpeciesName);
                        return Promise.resolve();
                    })
                    .catch(function onCancel(err) {
                        console.log('cancelled: %o', arguments);
                        return Promise.reject(err);
                    });

            };


            speciesDataService.getSpeciesList()
                .then(function(speciesList){
                    $scope.speciesList = speciesList;
                })
                .catch(function(err){
                    console.error(err);
                });
        }
    }
});
