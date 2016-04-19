define(
    [
        'require',
        'domReady!',
        'underscore',
        'ngApp'
    ],
    function (require) {
        var _ = require('underscore'),
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

                    $scope.getLocation = function() {
                        if (navigator.geolocation) {
                            navigator.geolocation.getCurrentPosition($scope.updatePosition);
                        }
                    };

                    $scope.updatePosition = function(position) {
                        if (position.coords.latitude && position.coords.longitude) {
                            console.log('updating position (%s,%s)', position.coords.latitude, position.coords.longitude);
                            $scope.setLatLng(position.coords.latitude, position.coords.longitude)
                        }
                    };

                    $scope.refreshMapData = function() {
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
                    };

                    $scope.setLatLng = function(lat, lng) {
                        var _lat = parseFloat(lat),
                            _lng = parseFloat(lng);
                        if ($scope.petData[$scope.visiblePetType]) {
                            $scope.petData[$scope.visiblePetType]['lostGeoLat'].val = _lat;
                            $scope.petData[$scope.visiblePetType]['lostGeoLon'].val = _lng;
                        }
                        $scope.refreshMapData();
                    };

                    $scope.updateMapView = function() {
                        console.log('updating map');
                        if ($scope.map.center.lat && $scope.map.center.lng) {
                            var newCenter = new google.maps.LatLng($scope.map.center.lat, $scope.map.center.lng);
                            if ($scope.markerObj) $scope.markerObj.setPosition(newCenter);
                            if ($scope.mapObj) $scope.mapObj.panTo(newCenter);
                        }
                    };

                    $scope.onDestroy = function () {
                        console.log('destroying map');
                        if (google && google.maps) google.maps.event.removeListener($scope.clickListener);
                        _.forEach($scope.watchRemovers, function (removeWatcher, index) {
                            removeWatcher();
                        })
                    };

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
                            $scope.setLatLng(event.latLng.lat(), event.latLng.lng());
                        });

                        $scope.watchRemovers.mapCenter = $scope.$watch('map.center', function (newValue, oldValue) {
                            console.log('updating map');
                            $scope.updateMapView();
                        });


                        $scope.watchRemovers.petDataLat = $scope.$watch('petData.' + $scope.visiblePetType + '.lostGeoLat.val', function (lat) {
                            if(lat) $scope.refreshMapData();
                        });

                        $scope.watchRemovers.petdataLng = $scope.$watch('petData.' + $scope.visiblePetType + '.lostGeoLon.val', function (lng) {
                            if(lng) $scope.refreshMapData();
                        });

                        $scope.getLocation();
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