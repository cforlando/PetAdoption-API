var _ = require('lodash');
var angular = require('angular');
var ngApp = require('ngApp');

module.exports = ngApp.directive('imagesInput', [function () {
    return {
        restrict: 'C',
        template: require('raw-loader!./templates/images-input.html'),
        controller: function ($scope, $element, $timeout) {
            var watcherHandlers = {};

            $scope.slider = {
                options: {
                    enabled: true,
                    dots: true,
                    infinite: false,
                    adaptiveHeight: true,
                    lazyLoad: 'ondemand'
                },
                state: {
                    isReady: true
                }
            };

            /**
             *
             * @param {Function} [callback]
             */
            $scope.initSlick = function (callback) {
                console.trace('imagesInput.initSlick()');
                $scope.slider.state.isReady = true;
                if (callback) $timeout(callback);
            };

            /**
             *
             * @param {Function} [callback]
             */
            $scope.destroySlick = function (callback) {
                $scope.slider.state.isReady = false;
                if (callback) $timeout(callback);
            };

            /**
             *
             * @param {Function} [callback]
             */
            $scope.reloadSlick = function (callback) {
                $scope.destroySlick(function () {
                    $scope.initSlick(callback);
                });
            };

            /**
             *
             * @param {String[]} imagesArr
             * @param {Function} [callback]
             */
            $scope.setImages = function (imagesArr, callback) {
                $scope.destroySlick(function () {
                    /*
                     var $slides = $element.find('.slide');
                     $slides.remove();
                     */
                    $scope.propData.val = imagesArr;
                    $scope.initSlick(callback);
                })
            };

            $scope.onDestroy = function () {
                $scope.destroySlick();
                _.forEach(watcherHandlers, function (handlerCallback) {
                    handlerCallback();
                })
            };

            $scope.removePhotoByIndex = function (imageIndex) {
                var imageMetas = _.map($scope.propData.val, function (imageURL, idx) {
                    return {
                        isUploadPreview: imageURL.match(/^data/)
                    }
                });

                if (imageMetas[imageIndex].isUploadPreview) {
                    // will trigger `onFileInputChange`, and consequently update the slider
                    // temporarily uploaded images are always first in the array
                    $scope.removeUploadByIndex(imageIndex)
                } else {
                    $scope.setImages(_.reject($scope.propData.val, function (savedImageURL, index) {
                        return index === imageIndex
                    }));
                }

            };


            /**
             *
             * @param imageURL
             */
            $scope.addPhoto = function (imageURL) {
                $scope.propData.val = [imageURL].concat($scope.propData.val);
            };


            $scope.onFileMediaChange = function (evt, $inputs) {
                // getUrls() is defined by jquery.file-input-urls.js
                $inputs.getUrls()
                    .then(function (fileUrls) {
                        $scope.$apply(function () {
                            var savedImages = _.reject($scope.propData.val, function (imageURL) {
                                // remove all temporary previously uploaded images
                                return imageURL.match(/^data/);
                            });

                            $scope.setImages(fileUrls.concat(savedImages));
                        })
                    })
                    .catch(function (err) {
                        console.error(err);
                    });
            };


            (function init() {
                // watch for external changes
                watcherHandlers.propData = $scope.$watch('petData.' + $scope.propData.key + '.val', function (newValue) {
                    if (_.isArray(newValue)) {
                        $scope.setImages(newValue);
                    }
                });
            })()

        },
        link: function (scope, element, attributes) {
            if (scope.onDestroy) scope.$on("$destroy", scope.onDestroy);
        }

    }
}]);
