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
                    var $photosForm = $element.find('.slider-upload-form'),
                        $fileInput = $photosForm.find(".image-upload__input"),
                        watcherHandlers = {};

                    $scope.$mediaInput = $fileInput;
                    $scope.mediaInputEl = $fileInput[0];

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

                    console.log('imagesInput - slider.$scope = %o', $scope);

                    $scope.destroySlick = function () {
                        console.log('imagesInput - destroySlick()');
                        if ($scope.slider.state.isRunning()) {
                            console.log('imagesInput - slider - destroying slick');
                            $scope.slider.$el.slick('unslick');
                        }
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
                                if(!$scope.slider.state.isRunning()){
                                    // another check to ensure initialize wasn't called multipe times
                                    // TODO ensure initSlick is only called once on file uploads
                                    $scope.slider.$el = $slider.slick($scope.slider.options);
                                }
                            })
                        } else {
                            console.warn('imagesInput.initSlick() - slick slider already running');
                        }
                    };

                    /**
                     *
                     * @param [options]
                     */
                    $scope.reloadSlick = function (options) {
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
                     * @param imagesArr
                     * @param {Object} [options]
                     * @param {Boolean} [options.forceReload=false]
                     */
                    $scope.setImages = function (imagesArr, options) {
                        var _options = _.defaults(options, {
                                forceReload: false
                            }),
                            setProps = function () {
                                $scope.propData.val = imagesArr;
                                console.log('imagesInput - setting propData.val = %o', imagesArr);
                                $scope.reloadSlick()
                            };

                        if ($scope.slider.state.isRunning()) {
                            console.log('imagesInput.setImages() - waiting to setProps');
                            $scope.slider.$el.one('destroy', function () {
                                setProps()
                            });
                            $scope.destroySlick();
                        } else {
                            setProps();
                            $scope.reloadSlick();
                        }

                    };

                    $scope.onDestroy = function () {
                        console.log('imagesInput - slider - destroying entire view');
                        $scope.destroySlick();
                        _.forEach(watcherHandlers, function (handlerCallback) {
                            handlerCallback();
                        })
                    };

                    $scope.uploadPhoto = function () {
                        $fileInput.click();
                    };

                    $scope.removePhotoByID = function (slideID) {
                        var $slideScope = $scope.getSlideByID(slideID);
                        if($slideScope.url.match(/^data/)){
                            // remove all temporary slides because we can't delete specific images from file input element
                           $scope.removeTemporaryPhotos();
                        } else{
                            // we use indexOf so that we only remove one and not any duplicate images
                            var imageURL = $slideScope.url,
                                imageIndex = $scope.propData.val.indexOf(imageURL);

                            // eagerly delete slideScope from cache
                            $scope.deregisterSlide($slideScope);

                            $scope.setImages(
                                _.filter($scope.propData.val, function (savedImageURL, index) {
                                    return index != imageIndex
                                }), {
                                    forceReload: true
                                });

                            $scope.setField($scope['propData'].key, {val: $scope.propData.val});
                        }
                    };

                    $scope.removePhotoByURL = function (imageURL) {
                        // we use indexOf so that we only remove one and not any duplicate images
                        var imageIndex = $scope.propData.val.indexOf(imageURL);

                        $scope.setImages(
                            _.filter($scope.propData.val, function (savedImageURL, index) {
                                return index != imageIndex
                            }), {
                                forceReload: true
                            });

                        $scope.setField($scope['propData'].key, {val: $scope.propData.val});
                    };

                    $scope.removeTemporaryPhotos = function () {

                        $scope.setImages(_.filter($scope.propData.val, function (imageURL) {
                            // remove preview data urls
                            return imageURL && !(/^data/.test(imageURL));
                        }))
                    };

                    /**
                     *
                     * @param imageURL
                     */
                    $scope.addPhoto = function (imageURL) {
                        console.log('imagesInput - adding %s', imageURL);
                        $scope.propData.val.push(imageURL);
                        $scope.setField($scope['propData'].key, _.extend({}, $scope['propData'], {val: $scope.propData.val}))
                    };

                    $scope.onFileInputChange = function () {
                        var input = this,
                            numOfFiles = input.files.length,
                            _previewPhotos = [];

                        $scope.$apply(function(){
                            $scope.removeTemporaryPhotos();
                        });

                        if (numOfFiles > 0) {
                            $scope.showLoading();
                            var reader = new FileReader(),
                                readIndex = 0,
                                isLoadComplete = function () {
                                    return readIndex === numOfFiles
                                };

                            reader.onload = function (e) {
                                readIndex++;
                                console.log('imagesInput - reader.onload(%o) - %d/%d', arguments, readIndex, numOfFiles);
                                _previewPhotos.push(e.target.result);
                                if (isLoadComplete()) {
                                    $scope.hideLoading();
                                    $scope.$apply(function () {
                                        console.log('files:', $scope.$mediaInput.prop('files'));
                                        $scope.setImages($scope.propData.val.concat(_previewPhotos));
                                    });
                                } else {
                                    reader.readAsDataURL(input.files[readIndex]);
                                }
                            };

                            reader.readAsDataURL(input.files[readIndex]);
                        }
                    };

                    $scope.getSlideByID = function (slideId) {
                        return $scope.slider.state.slides[slideId];
                    };

                    $scope.deregisterSlide = function ($slideScope) {
                        console.log('imagesInput - deregister[%o](%s)', $slideScope, $slideScope.url.substr(-20));
                        delete $scope.slider.state.slides[$slideScope.$id];
                        $scope.reloadSlick();
                    };


                    $scope.initSlide = function ($slideScope) {
                        $slideScope.$el.data('image-slide-id');
                        $scope.slider.state.slides[$slideScope.$id] = $slideScope;
                        console.log('imagesInput.initSlide(%o)', $slideScope);
                    };

                    $scope.verifySlide = function ($slide) {
                        var result = !!($scope.slider.state.slides[$slide.data('slideId')]);
                        console.log('imagesInput.verifySlide() - checking %o = %s', $slide, result);
                        return result;
                    };

                    $scope.registerSlide = function ($slideScope) {
                        console.log('imagesInput.registerSlide(%o)', $slideScope);
                        $scope.initSlide($slideScope);
                        if ($slideScope.$last) {
                            $scope.slider.state.lastSlide = $slideScope;
                            console.log('imagesInput.registerSlide(%o) - slide registered and initialized', $slideScope);
                            $scope.reloadSlick();
                        }
                    };


                    function init() {
                        console.log('imagesInput - init slider');
                        $scope['propData'].val = $scope['propData'].val || [];
                        $scope.registerImagesInput($scope);
                        $fileInput.on('change', $scope.onFileInputChange);

                        watcherHandlers.removeFileListener = function () {
                            $fileInput.off('change', null, $scope.onFileInputChange);
                        };

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
