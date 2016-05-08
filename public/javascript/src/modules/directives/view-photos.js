define([
    'ngApp',
    'jquery',
    'jquery-slick'
], function (ngApp) {
    var $ = require('jquery');
    return ngApp.directive('petPhotos', function () {
        return {
            restrict: 'C',
            controller: ['$scope', '$element',
                function ($scope, $element) {
                    var $photosForm = angular.element('.pet-photos-form'),
                        $fileInput = $photosForm.find(".file-upload__input"),
                        watcherHandlers = {};

                    $scope.mediaInputEl = $fileInput[0];
                    $scope.sliderImages = {
                        preview : [],
                        saved : []
                    };
                    $scope.slickOptions = {
                        dots: true,
                        infinite: false,
                        adaptiveHeight: true
                    };

                    console.log('init photos view w/ $scope', $scope);

                    function readMediaInput(input) {
                        var numOfFiles = input.files.length,
                            _previewPhotos = [];

                        if (numOfFiles > 0) {
                            var reader = new FileReader(),
                                readIndex = 0,
                                isLoadComplete = function(){return readIndex == numOfFiles};
                            $scope.sliderImages.preview = [];

                            reader.onload = function (e) {
                                readIndex++;
                                console.log('reader.onload(%o) - %d/%d', arguments, readIndex, numOfFiles);
                                // $scope.petData[$scope.visiblePetType].images.val.push(e.target.result);
                                _previewPhotos.push(e.target.result);
                                if(isLoadComplete()){
                                    $scope.$apply(function(){
                                        $scope.sliderImages.preview = _previewPhotos;
                                    });
                                } else {
                                    reader.readAsDataURL(input.files[readIndex]);
                                }
                            };

                            reader.readAsDataURL(input.files[readIndex]);
                        }
                    }

                    /**
                     *
                     * @param imageURL
                     */
                    function addImageSlide(imageURL) {
                        if($scope.$slider) $scope.$slider.slick('slickAdd', "<div class='slide-img-placeholder' data-src='" + imageURL + "' style=\"background-image:url('" + imageURL + "')\"></div>");
                    }

                    function onFileInputChange(){
                        readMediaInput(this);
                    }

                    function initSlider() {
                        console.log('creating slider w/ %o', $scope.slickOptions);
                        $scope.$slider = $element.find('.images-slider').slick($scope.slickOptions);
                        if($scope.petData[$scope.visiblePetType] && $scope.petData[$scope.visiblePetType].images) {
                            $scope.sliderImages.saved = $scope.petData[$scope.visiblePetType].images.val;
                        } else {
                            $scope.sliderImages.saved = [];
                        }
                        _.forEach($scope.sliderImages.saved.concat($scope.sliderImages.preview), function (imageURL, index) {
                            console.log('adding slider image %s', imageURL);
                            addImageSlide(imageURL);
                        });

                        watcherHandlers.previewImages = $scope.$watch('sliderImages.preview', reloadSlider);
                        watcherHandlers.savedImages = $scope.$watch('sliderImages.saved', reloadSlider);

                        watcherHandlers.petData = $scope.$watch('petData.' + $scope.visiblePetType + '.images.val', function () {
                            if($scope.petData[$scope.visiblePetType] && $scope.petData[$scope.visiblePetType].images){
                                $scope.sliderImages.saved = $scope.petData[$scope.visiblePetType].images.val;
                            } else {
                                $scope.sliderImages.saved = [];
                            }
                        });
                    }

                    function destroySlider() {
                        if ($scope.$slider) {
                            console.log('destroying slider');
                            _.forEach($scope.$slider.slick('getSlick').$slides, function ($slide, index) {
                                console.log('removing slider image %O', $slide);
                                $scope.$slider.slick('slickRemove', 0);
                            });
                            $scope.$slider.slick('unslick');
                        }
                    }

                    function reloadSlider() {
                        console.log('reloading slider');
                        destroySlider();
                        $scope.$slider = $element.find('.images-slider').slick($scope.slickOptions);
                        _.forEach($scope.sliderImages.saved.concat($scope.sliderImages.preview), function (imageURL, index) {
                            console.log('adding slider image %s', imageURL);
                            addImageSlide(imageURL);
                        });
                        console.log('reloaded slider');
                    }

                    $scope.uploadPhoto = function () {
                        $fileInput.click();
                    };

                    $scope.removePhoto = function () {
                        var removedImgSrc = $scope.$slider.find('.slick-current').attr('data-src'),
                            _images = _.without($scope.petData[$scope.visiblePetType].images.val, removedImgSrc);
                        console.log('deleting image: %s', removedImgSrc);
                        $scope.petData[$scope.visiblePetType].images.val = _images;
                    };

                    $scope.$on('$destroy', function(){
                        console.log('destroying photos view');

                        // watcherHandlers is an object of removal functions.
                        // we remove the listeners before making further changes
                        _.forEach(watcherHandlers, function(endWatcher, index){
                            console.log('destroying watcher: %s', index);
                            endWatcher();
                        });
                        destroySlider();
                        $fileInput.off('change', null, onFileInputChange);
                    });

                    $scope.$on('save:petData', function(){
                        $scope.sliderImages.preview = [];
                    });

                    $fileInput.on('change', onFileInputChange);

                    initSlider();

                }],
            link: function postLink(scope) {
                // scope.$slider = $(".images-slider");
                // scope.$slider = angular.element('.images-slider').slick(scope.slickOptions);
                // console.log('init slider');
            }
        };
    });
});
