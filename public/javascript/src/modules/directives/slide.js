define([
    'require',
    'underscore',
    'ngApp'
], function (require) {
    var ngApp = require('ngApp'),
        _ = require('underscore');

    return ngApp.directive('slide', [function () {
        return {
            restrict: 'EC',
            controller: ['$scope', '$element',
                function ($scope, $element) {
                    console.log('slide.$scope: %o', $scope);
                    /*
                     var sliderStateWatchHandler = $scope.$watch('slider.state.isInitialized', function(newVal){
                     console.log('slider.state.isInitialized - state change (%o)', newVal);
                     });
                     */

                    $scope.isSlideRendered = function(){
                        return ($element.height() > 56);
                    };
                    var slideValWatchHandler = $scope.$watch('slide', function (slideVal, oldSlideVal) {
                        if (!slideVal && !$scope.last) return;
                        var slideRenderedWatchHandler = $scope.$watch($scope.isSlideRendered, function(isRendered){
                            if(isRendered) {
                                $scope.registerSlide($scope);
                                slideRenderedWatchHandler();
                            }
                        })
                    });
                    $scope.onDestroy = function () {
                        slideValWatchHandler();
                    }

                }],
            link: function (scope, element, attrs) {
                scope.id = scope.$index;
                if (scope.onDestroy) scope.$on("$destroy", scope.onDestroy);

            }
        }
    }]);
});
