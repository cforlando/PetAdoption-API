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
                    $scope.watchHandlers = {};
                    var _initialData = $scope.petData[$scope.visiblePetType];

                    $scope.map = {
                        center: {
                            lat: (_initialData && _initialData['lostGeoLat']) ? _initialData['lostGeoLat'].val : 28.513651,
                            lng: (_initialData && _initialData['lostGeoLon']) ? _initialData['lostGeoLon'].val : -81.466219
                        },
                        marker: {
                            lat: (_initialData && _initialData['lostGeoLat']) ? _initialData['lostGeoLat'].val : 28.513651,
                            lng: (_initialData && _initialData['lostGeoLon']) ? _initialData['lostGeoLon'].val : -81.466219
                        },
                        mapTypeId: (window.google) ? google.maps.MapTypeId.ROADMAP : null,
                        zoom: 8,
                        scrollwheel: false,
                        zoomControl: true,
                        mapTypeControl: true,
                        disableDoubleClickZoom : true,
                        streetViewControl: false
                    };

                    $scope.getLocation = function() {
                        if (navigator.geolocation) {
                            navigator.geolocation.getCurrentPosition($scope.updatePosition);
                        }
                    };

                    $scope.updatePosition = function(position) {
                        console.log('$scope.updatePosition()');
                        if (position.coords.latitude && position.coords.longitude) {
                            console.log('$scope.updatePosition() @ %s,%s', position.coords.latitude, position.coords.longitude);
                            $scope.setLatLng(position.coords.latitude, position.coords.longitude)
                        }
                    };

                    $scope.refreshMapData = function() {
                        console.log('$scope.refreshMapData()');
                        if ($scope.petData[$scope.visiblePetType]) {
                            var _lat = parseFloat($scope.petData[$scope.visiblePetType]['lostGeoLat'].val),
                                _lng = parseFloat($scope.petData[$scope.visiblePetType]['lostGeoLon'].val);
                            $scope.map.center = {
                                lat: _lat,
                                lng: _lng
                            };
                            $scope.map.marker = {
                                lat: _lat,
                                lng: _lng
                            }
                        }
                    };

                    $scope.setLatLng = function(lat, lng) {
                        console.log('$scope.setLatLng()');
                        var _lat = parseFloat(lat),
                            _lng = parseFloat(lng);
                        // check to see if lostGeoLat has loaded in case of no mongodb connection
                        if ($scope.petData[$scope.visiblePetType] && $scope.petData[$scope.visiblePetType]['lostGeoLat']) {
                            $scope.petData[$scope.visiblePetType]['lostGeoLat'].val = _lat;
                            $scope.petData[$scope.visiblePetType]['lostGeoLon'].val = _lng;
                        }
                        $scope.refreshMapData();
                    };

                    $scope.updateMapView = function() {
                        console.log('$scope.updateMapView()');
                        if ($scope.map.center.lat && $scope.map.center.lng) {
                            var newCenter = new google.maps.LatLng($scope.map.center.lat, $scope.map.center.lng);
                            if ($scope.markerObj) $scope.markerObj.setPosition(newCenter);
                            if ($scope.mapObj) $scope.mapObj.panTo(newCenter);
                        }
                    };

                    $scope.onDestroy = function () {
                        console.log('$scope.onDestroy()');
                        if (google && google.maps) google.maps.event.removeListener($scope.clickListener);
                        _.forEach($scope.watchHandlers, function (removeWatcher, index) {
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
                        $scope.clickListener = google.maps.event.addListener(map, "dblclick", function (event) {
                            console.log('dblclick triggered.');

                            // display the lat/lng in your form's lat/lng fields
                            $scope.setLatLng(event.latLng.lat(), event.latLng.lng());
                            $scope.refreshMapData();
                            $scope.updateMapView();
                        });

                        $scope.watchHandlers.mapCenter = $scope.$watch('map.center', function (newValue, oldValue) {
                            console.log('mapCenter changed.');
                            $scope.updateMapView();
                        });


                        $scope.watchHandlers.petDataLat = $scope.$watch('petData.' + $scope.visiblePetType + '.lostGeoLat.val', function (lat) {
                            console.log('lostGeoLat.val changed.');
                            if(lat) $scope.refreshMapData();
                        });

                        $scope.watchHandlers.petdataLng = $scope.$watch('petData.' + $scope.visiblePetType + '.lostGeoLon.val', function (lng) {
                            console.log('lostGeoLon.val changed.');
                            if(lng) $scope.refreshMapData();
                        });

                        $scope.getLocation();
                    }

                    function _waitForGoogleMaps() {
                        $scope.googleCheckInterval = setInterval(function () {
                            if (window.google && google.maps) {
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

                    if (window.google && google.maps) {
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
