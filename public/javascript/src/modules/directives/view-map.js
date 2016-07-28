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
                controller: ['$scope', '$element', 'googleService', function ($scope, $element, googleService) {
                    $scope.watchHandlers = {};
                    var _initialData = $scope.petData[$scope.visiblePetType],
                        lonFieldName = $element.attr('data-lon-field-name'),
                        latFieldName = $element.attr('data-lat-field-name');

                    $scope.map = {
                        center: {
                            lat: (_initialData && _initialData[latFieldName] && _initialData[latFieldName].val) ? _initialData[latFieldName].val : 28.513651,
                            lng: (_initialData && _initialData[lonFieldName] && _initialData[lonFieldName].val) ? _initialData[lonFieldName].val : -81.466219
                        },
                        marker: {
                            lat: (_initialData && _initialData[latFieldName] && _initialData[latFieldName].val) ? _initialData[latFieldName].val : 28.513651,
                            lng: (_initialData && _initialData[lonFieldName] && _initialData[lonFieldName].val) ? _initialData[lonFieldName].val : -81.466219
                        },
                        mapTypeId: (window.google) ? google.maps.MapTypeId.ROADMAP : null,
                        zoom: 8,
                        scrollwheel: false,
                        zoomControl: true,
                        mapTypeControl: true,
                        disableDoubleClickZoom: true,
                        streetViewControl: false
                    };

                    $scope.getLocation = function () {
                        if (navigator.geolocation) {
                            navigator.geolocation.getCurrentPosition($scope.updatePosition);
                        }
                    };

                    $scope.updatePosition = function (position) {
                        console.log('$scope.updatePosition()');
                        if (position.coords.latitude && position.coords.longitude) {
                            console.log('$scope.updatePosition() @ %s,%s', position.coords.latitude, position.coords.longitude);
                            $scope.setLatLng(position.coords.latitude, position.coords.longitude)
                        }
                    };

                    $scope.refreshMapData = function () {
                        console.log('$scope.refreshMapData()');
                        if ($scope.petData[$scope.visiblePetType]) {
                            var _lat = parseFloat($scope.petData[$scope.visiblePetType][latFieldName].val),
                                _lng = parseFloat($scope.petData[$scope.visiblePetType][lonFieldName].val);
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

                    $scope.setLatLng = function (lat, lng) {
                        console.log('$scope.setLatLng()');
                        var _lat = parseFloat(lat),
                            _lng = parseFloat(lng);
                        // check to see if lat/lng values have loaded in case of no connection
                        if ($scope.petData[$scope.visiblePetType][latFieldName] && $scope.petData[$scope.visiblePetType][lonFieldName]) {
                            $scope.petData[$scope.visiblePetType][latFieldName].val = _lat;
                            $scope.petData[$scope.visiblePetType][lonFieldName].val = _lng;
                        }
                        $scope.refreshMapData();
                    };

                    $scope.updateMapView = function () {
                        console.log('$scope.updateMapView()');
                        if ($scope.map.center.lat && $scope.map.center.lng) {
                            var newCenter = new google.maps.LatLng($scope.map.center.lat, $scope.map.center.lng);
                            if ($scope.markerObj) $scope.markerObj.setPosition(newCenter);
                            if ($scope.mapObj) $scope.mapObj.panTo(newCenter);
                        }
                    };

                    $scope.onDestroy = function () {
                        console.log('$scope.onDestroy()');
                        if (googleService.isGoogleReady()) google.maps.event.removeListener($scope.clickListener);
                        $scope.updateWatchHandler()
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

                        $scope.updateWatchHandler = $scope.$watch(function () {
                            return (
                                $scope.map.center.lat &&
                                $scope.map.center.lng &&
                                $scope.petData[$scope.visiblePetType][latFieldName] &&
                                $scope.petData[$scope.visiblePetType][lonFieldName]
                            ) ?
                            ''+
                            $scope.map.center.lat +
                            $scope.map.center.lng +
                            $scope.petData[$scope.visiblePetType][latFieldName].val +
                            $scope.petData[$scope.visiblePetType][lonFieldName].val
                            :
                            false
                        }, function (newValue, oldValue) {
                            console.log('map changed: %o', arguments);
                            if (newValue) {
                                console.log("mapData: %o", newValue);
                                $scope.refreshMapData();
                                $scope.updateMapView();
                            }
                        });

                        $scope.getLocation();
                    }

                    googleService.onGoogleReady(initializeGoogleMaps);
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
