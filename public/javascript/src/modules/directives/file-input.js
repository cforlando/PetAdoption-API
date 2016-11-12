define([
    'require',
    'underscore',
    'text!modules/directives/views/file-input.html',
    'ngApp'
], function () {
    var _ = require('underscore'),
        ngApp = require('ngApp');

    ngApp.directive('fileInput', function () {
        return {
            restrict: 'EC',
            scope: true,
            template: require('text!modules/directives/views/file-input.html'),
            controller: ['$scope', '$element', '$timeout',
                function ($scope, $element, $timeout) {
                    console.log("init fileInput @ %o", $element);
                    $scope.namespaces = [];
                    $scope.get$inputs = function () {
                        return $element.find("input[type='file']");
                    };
                    $scope.$inputs = $scope.get$inputs();

                    $scope.clear = function(){
                        $scope.namespaces = [];
                    }

                    /**
                     * @param {Object} [options]
                     * @param {Boolean} [options.isSingle=false]
                     */
                    $scope.upload = function (options) {
                        var _options = _.defaults(options, {
                                isSingle: false
                            }),
                            $lastInput = $scope.$inputs.last();
                        if ($lastInput.length > 0) {
                            if ($lastInput.val() && !_options.isSingle) {
                                // create a new dom input element
                                $scope.namespaces.push(_options.namespace || 'uploads-' + $scope.namespaces.length);
                            } else {
                                // don't create anything new and use last input dom element as is
                            }
                        } else {
                            // skip checks and create a new dom input element
                            $scope.namespaces.push(_options.namespace || 'uploads-' + $scope.namespaces.length);
                        }
                        $timeout(function () {
                            $scope.reloadInputs();
                            $scope.$inputs.last().click();
                        })
                    };

                    $scope.onFileInputChange = function () {
                        $scope.$emit('file-input:change', $scope);
                    };

                    $scope.addInputListeners = function () {
                        $scope.$inputs = $scope.get$inputs();
                        $scope.$inputs.on('change', $scope.onFileInputChange);
                    };

                    $scope.removeInputListeners = function () {
                        $scope.$inputs.off('change', null, $scope.onFileInputChange);
                    };

                    $scope.reloadInputs = function () {
                        $scope.removeInputListeners();
                        $scope.addInputListeners();
                    };

                    $scope.onDestroy = function () {
                        $scope.removeInputListeners();
                    }

                    function init() {
                        if ($scope.registerMediaScope) $scope.registerMediaScope($scope);
                    }

                    init();
                }],
            link: function (scope, element, attributes) {
                // When the destroy event is triggered, check to see if the above
                // data is still available.
                if (scope.onDestroy) scope.$on("$destroy", scope.onDestroy);
            }
        }
    })
});
