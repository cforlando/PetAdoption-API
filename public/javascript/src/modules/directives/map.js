define(
    [
        'require',
        'domReady!',
        '$elements',
        'underscore',
        'ngApp'
    ],
    function (require) {
        var $window = require('$elements').window,
            _ = require('underscore'),
            ngApp = require('ngApp');
        return ngApp.directive('googleMaps', function () {
            return {
                restrict: 'C',
                controller: ['$scope', '$element', function ($scope, $element) {
                    $scope.watchRemovers = {};

                    $scope.map = {
                        center: {
                            lat: ($scope.petData[$scope.visiblePetType]) ? $scope.petData[$scope.visiblePetType]['lostGeoLat'].val : 28.513651,
                            lng: ($scope.petData[$scope.visiblePetType]) ? $scope.petData[$scope.visiblePetType]['lostGeoLon'].val : -81.466219
                        },
                        marker: {
                            lat: ($scope.petData[$scope.visiblePetType]) ? $scope.petData[$scope.visiblePetType]['lostGeoLat'].val : 28.513651,
                            lng: ($scope.petData[$scope.visiblePetType]) ? $scope.petData[$scope.visiblePetType]['lostGeoLon'].val : -81.466219
                        },
                        mapTypeId: google.maps.MapTypeId.ROADMAP,
                        zoom: 8,
                        scrollwheel: false,
                        zoomControl: true,
                        streetViewControl: false
                    };

                    function getLocation() {
                        if (navigator.geolocation) {
                            navigator.geolocation.getCurrentPosition(updatePosition);
                        }
                    }

                    function updatePosition(position) {
                        if (position.coords.latitude && position.coords.longitude) {
                            console.log('updating position (%s,%s)', position.coords.latitude, position.coords.longitude);
                            setLatLng(position.coords.latitude, position.coords.longitude)
                        }
                    }

                    function refreshMapData(){
                        if ($scope.petData[$scope.visiblePetType]) {
                            $scope.map.center = {
                                lat: parseFloat($scope.petData[$scope.visiblePetType]['lostGeoLat'].val),
                                lng: parseFloat($scope.petData[$scope.visiblePetType]['lostGeoLon'].val)
                            };
                            $scope.map.marker = {
                                lat: $scope.petData[$scope.visiblePetType]['lostGeoLat'].val,
                                lng: $scope.petData[$scope.visiblePetType]['lostGeoLon'].val
                            }
                        }
                    }

                    function setLatLng(lat, lng) {
                        var _lat = parseFloat(lat),
                            _lng = parseFloat(lng);
                        if ($scope.petData[$scope.visiblePetType]) {
                            $scope.petData[$scope.visiblePetType]['lostGeoLat'].val = _lat;
                            $scope.petData[$scope.visiblePetType]['lostGeoLon'].val = _lng;
                        }
                        refreshMapData();
                    }

                    function updateMapView() {
                        console.log('updating map');
                        if ($scope.map.center.lat && $scope.map.center.lng) {
                            var newCenter = new google.maps.LatLng($scope.map.center.lat, $scope.map.center.lng);
                            if ($scope.markerObj) $scope.markerObj.setPosition(newCenter);
                            if ($scope.mapObj) $scope.mapObj.panTo(newCenter);
                        }
                    }

                    function initializeGoogleMaps() {
                        var map = new google.maps.Map($element[0], $scope.map),
                            marker = new google.maps.Marker({
                                position: new google.maps.LatLng($scope.map.center.lat, $scope.map.center.lng),
                                map: map,
                                title: 'Location'
                            }),
                            markerHTMLContent = "",
                            infowindow = new google.maps.InfoWindow({
                                content: markerHTMLContent
                            });
                        $scope.markerObj = marker;
                        $scope.mapObj = map;

                        $scope.onMarkerClick = function () {
                            infowindow.open(map, marker);
                        };

                        // $scope.clickListener = google.maps.event.addListener(marker, 'click', $scope.onMarkerClick);
                        $scope.clickListener = google.maps.event.addListener(map, "click", function (event) {
                            // display the lat/lng in your form's lat/lng fields
                            setLatLng(event.latLng.lat(), event.latLng.lng());
                        });

                        $scope.watchRemovers.mapCenter = $scope.$watch('map.center', function (newValue, oldValue) {
                            console.log('updating map');
                            updateMapView();
                        });


                        $scope.watchRemovers.petDataLat = $scope.$watch('petData.' + $scope.visiblePetType + '.lostGeoLat', function (newValue, oldValue) {
                            refreshMapData();
                        });

                        $scope.watchRemovers.petdataLng = $scope.$watch('petData.' + $scope.visiblePetType + '.lostGeoLon', function (newValue, oldValue) {
                            refreshMapData();
                        });

                        getLocation();
                    }

                    function _waitForGoogleMaps() {
                        $scope.googleCheckInterval = setInterval(function () {
                            if (google && google.maps) {
                                clearTimeout($scope.googleCheckTimeout);
                                clearInterval($scope.googleCheckInterval);
                                initializeGoogleMaps();
                            }
                        }, 2000);

                        $scope.googleCheckTimeout = setTimeout(function () {
                            clearInterval($scope.googleCheckTimeout);
                            console.error('Could not load google maps');
                        }, 10000);
                    }

                    $scope.onDestroy = function () {
                        console.log('destroying map');
                        if (google && google.maps) google.maps.event.removeListener($scope.clickListener);
                        _.forEach($scope.watchRemovers, function (removeWatcher, index) {
                            removeWatcher();
                        })
                    };

                    if (google && google.maps) {
                        initializeGoogleMaps();
                    } else {
                        _waitForGoogleMaps();
                    }
                }],
                link: function (scope, element, attributes) {
                    // When the destroy event is triggered, check to see if the above
                    // data is still available.
                    if (scope.onDestroy) scope.$on("$destroy", scope.onDestroy);
                }
            }
        });


    })
;