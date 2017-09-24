var _ = require('lodash'),
    ngApp = require('ngApp');

module.exports = ngApp.directive('actionMenu', function () {
    return {
        restrict: 'C',
        scope: '@',
        controller: function ($scope, $mdBottomSheet) {

            $scope.state = {
                isVisible: false
            };

            function onBottomSheetClosed() {
                $scope.state.isVisible = false;
            }

            $scope.showBottomSheet = function () {
                $mdBottomSheet.show({
                    template: require('raw-loader!./templates/action-menu.html'),
                    controller: function () {
                        console.log('actionMenu.bottomSheet.controller()', arguments);
                        $scope.state.isVisible = true;
                    },
                    scope: $scope,
                    preserveScope: true
                }).then(
                    function () {
                        console.log('clicked %o', arguments);
                    },
                    function cancelled() {
                        console.log('cancelled');
                        onBottomSheetClosed();
                    });
            };

            $scope.closeBottomSheet = function () {
                $mdBottomSheet.hide();
                onBottomSheetClosed();
            };

            $scope.$on('toggle:action-menu', function () {
                console.log('$scope.$on(toggle:action-menu)');
                if (!$scope.state.isVisible) {
                    $scope.showBottomSheet();
                } else {
                    $scope.closeBottomSheet();
                }
            })
        }
    };
});
