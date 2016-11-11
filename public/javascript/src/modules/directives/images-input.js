define([
    'require',
    'text!./views/images-input.html',
    'jquery-slick',
    'angular',
    'underscore',
    'ngApp'
], function (require) {
    var _ = require('underscore'),
        angular = require('angular'),
        ngApp = require('ngApp');
    return ngApp.directive('slider', [function () {
        return {
            restrict: 'EC',
            template: require('text!./views/images-input.html'),
            controller: ['$scope', '$element', '$timeout', 'dataParser',
                function ($scope, $element, $timeout, dataParser) {
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
                            isReady: true,
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
                        console.log('imagesInput - destroySlick()');
                        $scope.slider.state.isReady = false;
                        if (callback) $timeout(callback);
                    };

                    /**
                     *
                     * @param {Function} [callback]
                     */
                    $scope.reloadSlick = function (callback) {
                        $scope.destroySlick(function(){
                            $scope.initSlick(callback);
                        });
                    };

                    /**
                     *
                     * @param {String[]} imagesArr
                     * @param {Function} [callback]
                     */
                    $scope.setImages = function (imagesArr, callback) {
                        $scope.destroySlick(function(){
                            /*
                            var $slides = $element.find('.slide');
                            $slides.remove();
                            */
                            $scope.propData.val = imagesArr;
                            $scope.setField($scope.propData.key, {val: $scope.propData.val});
                            console.log('imagesInput - setting propData.val = %o', imagesArr);
                            $scope.initSlick(callback);
                        })
                    };

                    $scope.onDestroy = function () {
                        console.log('imagesInput.onDestroy()');
                        $scope.destroySlick();
                        _.forEach(watcherHandlers, function (handlerCallback) {
                            handlerCallback();
                        })
                    };

                    $scope.removePhotoByProps = function (url, imageIndex) {
                        var savedImagesCount = _.chain($scope.propData.val)
                            .reject(function(imageURL){
                                return imageURL.match(/^data/)
                            })
                            .value()
                            .length;

                        if (imageIndex >= savedImagesCount) {
                            $scope.$fileInputScope.namespaces.splice(imageIndex - savedImagesCount, 1)
                        }

                        $scope.setImages(_.reject($scope.propData.val, function (savedImageURL, index) {
                            return index === imageIndex
                        }));
                    }


                    /**
                     *
                     * @param imageURL
                     */
                    $scope.addPhoto = function (imageURL) {
                        console.log('imagesInput - adding %s', imageURL);
                        $scope.setField($scope.propData.key, _.concat($scope.propData.val, imageURL));
                    };

                    $scope.getSlideScopeByID = function (slideId) {
                        return $scope.slider.state.slides[slideId];
                    };

                    $scope.registerMediaScope = function($fileInputScope){
                        $scope.$fileInputScope = $fileInputScope;
                        $scope.$parent.registerMediaScope($scope.$fileInputScope);
                    };

                    function init() {
                        console.log('imagesInput - init slider');

                        watcherHandlers.fileInputs = $scope.$on('file-input:change', function (evt, $fileInputScope) {
                            console.log("on('file-input:change')");
                            dataParser.getURLsFrom$inputs($fileInputScope.$inputs, function (err, fileURLs) {
                                $scope.$apply(function () {
                                    $scope.setImages(_.chain($scope.propData.val)
                                                        .reject(function(imageURL){
                                                            // remove previous temporary images
                                                            return imageURL.match(/^data/);
                                                        })
                                                        .concat(fileURLs)
                                                        .value());
                                })
                            });
                        });

                        watcherHandlers.propData = $scope.$watch('petData.' + $scope.propData.key + '.val', function (newValue) {
                            console.log('imagesInput - slider - new propData images: %o', newValue);
                            if (!_.isArray(newValue)) {
                                $scope.setImages([]);
                            } else {
                                $scope.setImages(newValue);
                            }
                        });
                    }

                    init()

                }],
            link: function (scope, element, attributes) {
                // When the destroy event is triggered, check to see if the above
                // data is still available.
                if (scope.onDestroy) scope.$on("$destroy", scope.onDestroy);
            }

        }
    }]);
});
