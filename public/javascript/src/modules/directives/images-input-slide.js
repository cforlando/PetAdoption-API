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
            scope: true,
            controller: ['$scope', '$element',
                function ($scope, $element) {
                    console.log('image - slide.$scope: %o', $scope);

                    $scope.isSlideRendered = function () {
                        return ($element.height() > 72);
                    };

                    var urlWatchHandler = $scope.$watch('url', function (imageURL, oldImageURL) {
                        if (!imageURL || !$scope.last) return;
                        var isRenderedWatchHandler = $scope.$watch($scope.isSlideRendered, function (isRendered) {
                            if (isRendered) {
                                init();
                                isRenderedWatchHandler();
                            }
                        })
                    });

                    $scope.onDestroy = function () {
                        console.log('image - slide.onDestroy(%s)', $scope.url.substr(-20));
                        $scope.deregisterSlide($scope);
                        urlWatchHandler();
                    };

                    function init() {
                        // workaround for slick('unslick') restoring removed images
                        // TODO find better solution for handling display when unslick restores removed images
                        $element.addClass('visible');
                        $scope.$el = $element;
                        $scope.registerSlide($scope);
                    }

                }],
            link: function (scope, element, attrs) {
                element.attr('data-slide-id', scope.$id);
                if (scope.onDestroy) scope.$on("$destroy", scope.onDestroy);

            }
        }
    }]);
});
