define([
    'require',
    'ngApp'
], function (require) {
    var ngApp = require('ngApp');
    ngApp.directive('imagePlaceholder', function () {
        return {
            restrict: 'ACE',
            controller: ['$scope', '$element', function ($scope, $element) {

                $scope.$watch("src", function (val) {
                    if (val) $element.css({'background-image': 'url("' + val + '")'});
                });

            }],
            link: function (scope, element, attrs) {
                console.log('imagePlaceholder.scope', scope);

                attrs.$observe('imagePlaceholder', function (value) {
                    console.log('imagePlaceholder - setting background-image to: %s', value);
                    scope.src = value;
                });
                if (scope.onDestroy) scope.$on("$destroy", scope.onDestroy);
            }
        }
    })
})
