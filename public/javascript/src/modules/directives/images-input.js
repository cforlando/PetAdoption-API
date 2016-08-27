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
                            visible: []
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
                        if($scope.$slider) {
                            $scope.$slider.slick('unslick');
                        }
                        $scope.slider.state.isInitialized = false;
                    };

                    /**
                     *
                     * @param [options]
                     * @param {Function} [options.preDestroy]
                     * @param {Function} [options.preInit]
                     * @param {Function} [options.postInit]
                     * @param {Boolean} [options.forceInit]
                     */
                    $scope.reloadSlider = function (options) {
                        var _options = _.extend({}, options);
                        console.log('reloading slider');
                        if (_options.preDestroy) _options.preDestroy();
                        $scope.destroySlick();
                        if (_options.preInit) _options.preInit();
                        if (_options.forceInit) $scope.initSlick();
                        console.log('reloaded slider');
                    };

                    $scope.initSlick = function () {
                        $timeout(function(){
                            console.trace('creating slider w/ %o', $scope.slider.options);
                            $scope.$slider = $element.find('.slides').slick($scope.slider.options);
                            $scope.slider.state.isInitialized = true;
                        })
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

                    $scope.removePhoto = function (imageURL) {
                        var visibleIndex = $scope.slider.images.visible.indexOf(imageURL);
                        $scope.slider.images.visible = _.filter($scope.slider.images.visible, function(visibleURL, index){
                            return index != visibleIndex
                        });

                        $scope.setField($scope['propData'].key, {val: $scope.slider.images.visible});
                        $scope.reloadSlider({
                            forceInit : true
                        })
                    };

                    /**
                     *
                     * @param imageURL
                     */
                    $scope.addPhoto = function (imageURL) {
                        $scope.slider.images.visible.push(imageURL);
                        $scope.setField($scope['propData'].key, _.extend({}, $scope['propData'], {val: $scope.slider.images.visible}))
                    };

                    $scope.onFileInputChange = function() {
                        var input = this,
                            numOfFiles = input.files.length,
                            _previewPhotos = [];

                        if (numOfFiles > 0) {
                            var reader = new FileReader(),
                                readIndex = 0,
                                isLoadComplete = function () {
                                    return readIndex === numOfFiles
                                };

                            reader.onload = function (e) {
                                readIndex++;
                                console.log('reader.onload(%o) - %d/%d', arguments, readIndex, numOfFiles);
                                _previewPhotos.push(e.target.result);
                                if (isLoadComplete()) {
                                    $scope.$apply(function () {
                                        $scope.slider.images.visible = $scope.slider.images.visible.concat(_previewPhotos);
                                    });
                                } else {
                                    reader.readAsDataURL(input.files[readIndex]);
                                }
                            };

                            reader.readAsDataURL(input.files[readIndex]);
                        }
                    };




                    $scope.initSliderData = function () {
                        console.log('init slider');
                        $scope.slider.images.visible = $scope['propData'].val || [];

                        $scope.setPetDataMediaInput($scope.mediaInputEl);
                        $scope.slider.state.isInitialized = false;


                        watcherHandlers.removeFileListener = function () {
                            $fileInput.off('change', null, $scope.onFileInputChange);
                        };

                        $fileInput.on('change', $scope.onFileInputChange);
;

                        watcherHandlers.propData = $scope.$watch('propData.val', function (newValue) {
                            console.log('slider - new propData images: %o', newValue);
                            $scope.reloadSlider({
                                preInit: function () {
                                    if (_.isArray(newValue)) {
                                        console.log('slider - assigning new visible images: %o', newValue);
                                        $scope.slider.images.visible = newValue.slice(0);
                                    } else {
                                        $scope.slider.images.visible = [];
                                    }
                                }
                            })
                        });

                        var valueWatchNamespace = 'petData.' + $scope['propData'].key + '.val';
                        watcherHandlers.petData = $scope.$watch(valueWatchNamespace, function (newValue) {
                            console.log('slider - new petData images: %o', newValue);
                            if (_.isArray(newValue)) {
                                $scope.propData.val = newValue;

                                // fix for slick('unslick') restoring removed images
                                if( $scope.$slider){
                                    if(newValue.length >=  1 &&  newValue[0]){
                                        $scope.$slider.css({
                                            opacity : 1
                                        })
                                    } else {
                                        $scope.$slider.css({
                                            opacity : 0
                                        })
                                    }
                                }
                            } else {
                                $scope.propData.val = newValue;
                            }
                        });
                    };
                    console.log('slider.$scope = %o', $scope);

                    
                    $scope.registerSlide = function($slideScope){
                        console.log('imagesInput.registerSlide(%o)', $slideScope);
                        if ($scope.slider.state.isInitialized === false ) {
                            if($slideScope.$last){
                                console.log('imagesInput.registerSlide() - slide slide registered an initialzied');
                                $scope.initSlick();
                            }
                        }
                    };

                    $scope.initSliderData()

                }],
            link: function (scope, element, attributes) {
                // When the destroy event is triggered, check to see if the above
                // data is still available.
                if (scope.onDestroy) scope.$on("$destroy", scope.onDestroy);
            }

        }
    }]);
});
