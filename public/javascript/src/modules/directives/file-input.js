define([
    'require',
    'underscore',
    'ngApp'
], function(){
    var _ = require('underscore'),
        ngApp = require('ngApp');

    ngApp.directive('fileInput', function(){
        return {
            restrict: 'EC',
            scope: true,
            controller: ['$scope', '$element', function($scope, $element){
                $scope.$input = $element.find("input[type='file']");

                $scope.upload = function () {
                    $scope.$input.click();
                };

                $scope.onFileInputChange = function () {
                    var input = this,
                        numOfFiles = input.files.length,
                        _previewPhotos = [];

                    $scope.$broadcast('file-input:change', $scope);

                    if (numOfFiles > 0) {
                        $scope.showLoading();
                        var reader = new FileReader(),
                            readIndex = 0,
                            isLoadComplete = function () {
                                return readIndex === numOfFiles
                            };

                        reader.onload = function (e) {
                            readIndex++;
                            console.log('file input - reader.onload(%o) - %d/%d', arguments, readIndex, numOfFiles);
                            _previewPhotos.push(e.target.result);
                            if (isLoadComplete()) {
                                $scope.hideLoading();
                                console.log('file input - load complete', arguments, readIndex, numOfFiles);
                                $scope.files = _previewPhotos;
                                $scope.$emit('file-input:set', $scope);
                            } else {
                                reader.readAsDataURL(input.files[readIndex]);
                            }
                        };

                        reader.readAsDataURL(input.files[readIndex]);
                    }
                };

                function init(){
                    if ($scope.registerFileDOMElement) $scope.registerFileDOMElement($scope.$input[0]);

                    $scope.$input.on('change', $scope.onFileInputChange);

                    $scope.onDestroy = function(){
                        $scope.$input.off('change', null, $scope.onFileInputChange);
                    }
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