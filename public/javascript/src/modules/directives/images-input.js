define([
    'require',
    'text!./views/images-input.html',
    'jquery-slick',
    'underscore',
    'ngApp'
], function (require) {
    var _ = require('underscore'),
        ngApp = require('ngApp');
    return ngApp.directive('slider', [function () {
        return {
            restrict: 'EC',
            template: require('text!./views/images-input.html'),
            controller: ['$scope', '$element', '$timeout',
                function ($scope, $element, $timeout) {
                    var watcherHandlers = {};

                    $scope.slider = {
                        options: {
                            dots: true,
                            infinite: false,
                            adaptiveHeight: true,
                            lazyLoad: 'ondemand'
                        },
                        state: {
                            isRunning: function () {
                                return ($scope.slider.$el && $scope.slider.$el.hasClass('slick-initialized'))
                            },
                            slides: {}
                        },
                        $el: $element.find('.slides')
                    };

                    $scope.initSlick = function () {
                        console.trace('imagesInput.initSlick()');
                        if (!$scope.slider.state.isRunning()) {
                            // cleanup slick
                            var $slides = $element.find('.slide');
                            if ($scope.propData.val.length == 0 && $slides.length > 0) {
                                // clear all slides
                                console.log('imagesInput - deleting all slides');
                                $slides.remove();
                            } else if (_.keys($scope.slider.state.slides).length > 0) {
                                console.log('imagesInput - verifying %d slides', $slides.length);
                                // remove ghost slides
                                $slides.each(function (index, el) {
                                    var $slide = $element.find(el);
                                    if (!$scope.verifySlide($slide)) $slide.remove();
                                });
                            } else {
                                console.log('imagesInput.initSlick() - no cleanup necessary: %o', $slides);
                            }

                            $timeout(function () {
                                console.log('imagesInput - creating slider w/ %o', $scope.slider.options);
                                var $slider = $element.find('.slides');
                                console.log('imagesInput - $slider.length', $slider.find('.slide').length);
                                if (!$scope.slider.state.isRunning()) {
                                    // another check to ensure initialize wasn't called multipe times
                                    // TODO ensure initSlick is only called once on file uploads
                                    $scope.slider.$el = $slider.slick($scope.slider.options);
                                }
                            })
                        } else {
                            console.warn('imagesInput.initSlick() - slick slider already running');
                        }
                    };

                    $scope.destroySlick = function () {
                        console.log('imagesInput - destroySlick()');
                        if ($scope.slider.state.isRunning()) {
                            console.log('imagesInput - slider - destroying slick');
                            $scope.slider.$el.slick('unslick');
                        }
                    };

                    $scope.reloadSlick = function () {
                        if ($scope.slider.state.isRunning()) {
                            console.log('imagesInput.reloadSlider() - waiting to setProps');
                            $scope.slider.$el.one('destroy', function () {
                                $scope.initSlick();
                            });
                            $scope.destroySlick();
                        } else {
                            $scope.initSlick();
                        }
                    };

                    /**
                     *
                     * @param {String[]} imagesArr
                     * @param {Function} [callback]
                     */
                    $scope.setImages = function (imagesArr, callback) {
                        var setProps = function () {
                            $scope.propData.val = imagesArr;
                            console.log('imagesInput - setting propData.val = %o', imagesArr);
                            $scope.reloadSlick();
                            if (callback) callback();
                        };

                        if ($scope.slider.state.isRunning()) {
                            console.log('imagesInput.setImages() - waiting to setProps');
                            $scope.slider.$el.one('destroy', function () {
                                setProps();
                            });
                            $scope.destroySlick();
                        } else {
                            setProps();
                        }

                    };

                    $scope.onDestroy = function () {
                        console.log('imagesInput.onDestroy()');
                        $scope.destroySlick();
                        _.forEach(watcherHandlers, function (handlerCallback) {
                            handlerCallback();
                        })
                    };

                    $scope.removePhotoByID = function (slideID) {
                        var $slideScope = $scope.getSlideScopeByID(slideID);
                        if ($slideScope.url.match(/^data/)) {
                            // remove all temporary slides because we can't delete specific images from file input element
                            $scope.removeTemporaryPhotos();
                        } else {
                            // we use indexOf so that we only remove one and not any duplicate images
                            var imageURL = $slideScope.url,
                                imageIndex = $scope.propData.val.indexOf(imageURL);

                            // eagerly delete slideScope from cache
                            $scope.deregisterSlide($slideScope);

                            $scope.setField($scope['propData'].key, {val: _.reject($scope.propData.val, function (savedImageURL, index) {
                                return index === imageIndex
                            })});
                        }
                    };

                    $scope.removePhotoByURL = function (imageURL) {
                        // we use indexOf so that we only remove one and not any duplicate images
                        var imageIndex = $scope.propData.val.indexOf(imageURL);

                        $scope.setField($scope['propData'].key, {val: _.reject($scope.propData.val, function (savedImageURL, index) {
                            return index === imageIndex
                        })});
                    };

                    $scope.removeTemporaryPhotos = function () {

                        $scope.setImages(_.reject($scope.propData.val, function (imageURL) {
                            // reject preview data urls
                            return imageURL.match(/^data/);
                        }))
                    };

                    /**
                     *
                     * @param imageURL
                     */
                    $scope.addPhoto = function (imageURL) {
                        console.log('imagesInput - adding %s', imageURL);
                        $scope.propData.val.push(imageURL);
                        $scope.setField($scope['propData'].key, _.defaults({val: $scope.propData.val}, $scope['propData']))
                    };

                    $scope.getSlideScopeByID = function (slideId) {
                        return $scope.slider.state.slides[slideId];
                    };


                    $scope.verifySlide = function ($slide) {
                        var result = !!($scope.slider.state.slides[$slide.data('slideId')]);
                        console.log('imagesInput.verifySlide() - checking %o = %s', $slide, result);
                        return result;
                    };

                    $scope.registerSlide = function ($slideScope) {
                        console.log('imagesInput.registerSlide(%o)', $slideScope);
                        $slideScope.$el.data('image-slide-id');
                        $scope.slider.state.slides[$slideScope.$id] = $slideScope;
                        if ($slideScope.$last) {
                            $scope.slider.state.lastSlide = $slideScope;
                            console.log('imagesInput.registerSlide(%o) - last slide registered and initialized', $slideScope);
                            $scope.reloadSlick();
                        }
                    };

                    $scope.deregisterSlide = function ($slideScope) {
                        console.log('imagesInput - deregister[%o](%s)', $slideScope, $slideScope.url.substr(-20));
                        delete $scope.slider.state.slides[$slideScope.$id];
                        $scope.reloadSlick();
                    };

                    function init() {
                        console.log('imagesInput - init slider');
                        $scope['propData'].val = $scope['propData'].val || [];

                        $scope.$on('file-input:change', function () {
                            console.log("on('file-input:change')");
                            $scope.$apply(function () {
                                $scope.removeTemporaryPhotos();
                            })
                        });

                        $scope.$on('file-input:set', function ($evt, $mediaFormScope) {
                            console.log("on('file-input:set'): %o", arguments);
                            $scope.$apply(function () {
                                $scope.setImages($scope.propData.val.concat($mediaFormScope.files));
                            });
                        });
                        watcherHandlers.propData = $scope.$watch('propData.val', function (newValue) {
                            console.log('imagesInput - slider - new propData images: %o', newValue);
                            if (!_.isArray(newValue)) {
                                $scope.setImages([]);
                            } else if (newValue.length == 0) {
                                // slick will not be initialized by slide callbacks so we do it manually
                                $scope.reloadSlick();
                            } else {
                                // slick wiil be initialized by slide callbacks via registerSlide
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
