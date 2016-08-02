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

                    $scope.mediaInputEl = $fileInput[0];

                    $scope.slider = {
                        images : {
                            preview: [],
                            visible: [],
                            saved: []
                        },
                        options : {
                            dots: true,
                            infinite: false,
                            adaptiveHeight: true,
                            lazyLoad: 'ondemand'
                        },
                        state : {
                            isInitialized : null
                        }
                    };

                    $scope.destroySlick = function () {
                        console.log('slider - destroying slick');
                        if($scope.$slider) $scope.$slider.slick('unslick');
                        $scope.slider.state.isInitialized = false;
                    };

                    /**
                     *
                     * @param [options]
                     * @param [options.preDestroy]
                     * @param [options.preInit]
                     * @param [options.postInit]
                     */
                    $scope.reloadSlider = function (options) {
                        var _options = _.extend({}, options);
                        console.log('reloading slider');
                        if (_options.preDestroy) _options.preDestroy();
                        $scope.destroySlick();
                        if (_options.preInit) _options.preInit();
                        console.log('reloaded slider');
                    };

                    $scope.initSlick = function () {
                        console.trace('creating slider w/ %o', $scope.slider.options);
                        $scope.$slider = $element.find('.slides').slick($scope.slider.options);
                        $scope.slider.state.isInitialized = true;
                    };

                    $scope.onDestroy = function () {
                        console.log('slider - destroying entire view');
                        $scope.destroySlick();
                        _.forEach($scope.watchHandlers, function (handlerCallback) {
                            handlerCallback();
                        })
                    };

                    $scope.uploadPhoto = function () {
                        $fileInput.click();
                    };

                    $scope.removePhoto = function (index) {
                        $scope.slider.images.visible.splice(index, 1);
                        $scope.setField($scope['propData'].key, {val: $scope.slider.images.visible})
                    };

                    /**
                     *
                     * @param imageURL
                     */
                    $scope.addPhoto = function (imageURL) {
                        $scope.slider.images.visible.push(imageURL);
                        $scope.setField($scope['propData'].key, _.extend({}, $scope['propData'], {val: $scope.slider.images.visible}))
                    };

                    $scope.initSlider = function () {
                        console.log('init slider');
                        // $scope.initSlick();
                        $scope.slider.images.saved = $scope['propData'].val || [];

                        $scope.setMediaInputEl($scope.mediaInputEl);
                        $scope.slider.state.isInitialized = false;

                        $fileInput.on('change', onFileInputChange);

                        watcherHandlers.removeFileListener = function () {
                            $fileInput.off('change', null, onFileInputChange);
                        };

                        watcherHandlers.previewImages = $scope.$watch('slider.images.preview', function (newValue) {
                            $scope.reloadSlider({
                                preInit: function () {
                                    console.log('slider - new preview images: %o', newValue);
                                    $scope.slider.images.visible = $scope.slider.images.saved.concat($scope.slider.images.preview);
                                }
                            })
                        });
                        watcherHandlers.savedImages = $scope.$watch('slider.images.saved', function (newValue) {
                            console.log('slider - new saved images: %o', newValue);
                            $scope.reloadSlider({
                                preInit: function () {
                                    console.log('slider - assigning new visible images: %o', newValue);
                                    $scope.slider.images.visible = $scope.slider.images.saved.concat($scope.slider.images.preview);
                                }
                            })
                        });

                        watcherHandlers.propData = $scope.$watch('propData.val', function (newValue) {
                            console.log('slider - new propData images: %o', newValue);
                            if (_.isArray(newValue)) {
                                console.log('slider - assigning new images to saved.');
                                $scope.slider.images.saved = newValue;
                            } else {
                                $scope.slider.images.saved = [];
                            }
                        });

                        watcherHandlers.petData = $scope.$watch('petData.' + $scope['propData'].key + '.val', function (newValue) {
                            console.log('slider - new propData images: %o', newValue);
                            if (_.isArray(newValue)) {
                                $scope.propData.val = newValue;
                            } else {
                                $scope.propData.val = newValue;
                            }
                            $scope.slider.images.preview = [];
                        });
                    };
                    console.log('slider.$scope = %o', $scope);

                    function readMediaInput(input) {
                        var numOfFiles = input.files.length,
                            _previewPhotos = [];

                        if (numOfFiles > 0) {
                            var reader = new FileReader(),
                                readIndex = 0,
                                isLoadComplete = function () {
                                    return readIndex == numOfFiles
                                };
                            $scope.slider.images.preview = [];

                            reader.onload = function (e) {
                                readIndex++;
                                console.log('reader.onload(%o) - %d/%d', arguments, readIndex, numOfFiles);
                                // $scope['propData'].val.push(e.target.result);
                                _previewPhotos.push(e.target.result);
                                if (isLoadComplete()) {
                                    $scope.$apply(function () {
                                        $scope.slider.images.preview = _previewPhotos;
                                        $scope.slider.images.visible = $scope.slider.images.saved.concat($scope.slider.images.preview);
                                    });
                                } else {
                                    reader.readAsDataURL(input.files[readIndex]);
                                }
                            };

                            reader.readAsDataURL(input.files[readIndex]);
                        }
                    }


                    function onFileInputChange() {
                        readMediaInput(this);
                    }

                    $scope.onLastSlide = function () {
                        $timeout(function () {
                            // not supply a number alleged causes this to execute on render completion
                            $scope.initSlick();
                        })
                    };
                    $scope.initSlider()

                }],
            link: function (scope, element, attributes) {
                // When the destroy event is triggered, check to see if the above
                // data is still available.
                if (scope.onDestroy) scope.$on("$destroy", scope.onDestroy);
            }

        }
    }]);
});