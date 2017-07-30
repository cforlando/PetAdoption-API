var _ = require('lodash');
var ngApp = require('ngApp');

module.exports = ngApp.directive('fileInput', function () {
    return {
        restrict: 'EC',
        scope: {
            onFileInputChangeCallback: '&onFileInputChange',
            upload: '=trigger',
            inputLimit: '&'
        },
        transclude: true,
        template: require('raw!./templates/file-input.html'),
        controller: function ($scope, $element, $timeout) {
            console.log("init fileInput @ %o", $element);
            $scope.namespaces = [];
            $scope.get$inputs = function () {
                return $element.find("input[type='file']");
            };
            $scope.$inputs = $scope.get$inputs();

            $scope.clear = function () {
                $scope.namespaces = [];
            };

            /**
             * @param {Object} [options]
             * @param {Boolean} [options.inputLimit=1]
             */
            $scope.upload = function (options) {
                var opts = _.defaults(options, {
                    inputLimit: $scope.inputLimit || 1
                });
                var $lastInput = $scope.$inputs.last();

                if ($lastInput.length > 0) {
                    if ($lastInput.val() && $lastInput.length >= opts.inputLimit) {
                        // create a new dom input element
                        $scope.namespaces.push(opts.namespace || 'uploads-' + $scope.namespaces.length);
                    } else {
                        // don't create anything new and use last input dom element as is
                    }
                } else {
                    // skip checks and create a new dom input element
                    $scope.namespaces.push(opts.namespace || 'uploads-' + $scope.namespaces.length);
                }

                $timeout(function () {
                    $scope.reloadFileInputs();
                    $scope.$inputs.last().click();
                })
            };

            $scope.removeUploadByIndex = function (uploadIdx) {
                $scope.namespaces.splice(uploadIdx, 1);
                $scope.onFileInputChange({action: 'remove', idx: uploadIdx});
            };

            $scope.onFileInputChange = function (evt) {
                $scope.$emit('file-input:change', $scope);
                $scope.onFileInputChangeCallback()(evt, $scope.get$inputs(), $scope);
            };

            $scope.addFileInputListeners = function () {
                $scope.$inputs = $scope.get$inputs();
                $scope.$inputs.on('change', $scope.onFileInputChange);
            };

            $scope.removeFileInputListeners = function () {
                $scope.$inputs.off('change', null, $scope.onFileInputChange);
            };

            $scope.reloadFileInputs = function () {
                $scope.removeFileInputListeners();
                $scope.addFileInputListeners();
            };

            $scope.onDestroy = function () {
                $scope.removeFileInputListeners();
            };

            (function init() {
                if ($scope.registerMediaScope) $scope.registerMediaScope($scope);
            })();
        },
        link: function (scope, element, attributes) {
            // When the destroy event is triggered, check to see if the above
            // data is still available.
            if (scope.onDestroy) scope.$on("$destroy", scope.onDestroy);
        }
    }
})
