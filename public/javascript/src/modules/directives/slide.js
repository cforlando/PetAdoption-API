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
                    var sliderStateWatchHandler = $scope.$watch('slider.state.isInitialized', function(newVal){
                        console.log('slider.state.isInitialized - state change (%o)', newVal);
                        if (newVal === false && $scope.$last) {
                            console.log('isLastSlide - %s', $scope.$index);
                            $scope.onLastSlide();
                        }
                    });

                    $scope.onDestroy = function(){
                        sliderStateWatchHandler();
                    }
                }],
            link : function(scope){
                scope.id = scope.$index;
                if (scope.onDestroy) scope.$on("$destroy", scope.onDestroy);
            }
        }
    }]);
});