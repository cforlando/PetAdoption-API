define([
    'require',
    'text!./views/location-input.html',
    'ngApp'
], function (require) {
    var ngApp = require('ngApp');
    return ngApp.directive('locationInput', [function () {
        return {
            restrict: 'EC',
            template: require('text!./views/location-input.html'),
            controller: ['$scope', '$element', 'googleService', '$timeout',
                function ($scope, $element, googleService, $timeout) {
                    console.log('map.$scope: %o', $scope);

                    $scope.askForLocation = function () {
                        if (navigator.geolocation) {
                            navigator.geolocation.getCurrentPosition(function (position) {
                                console.log('$scope.getLocation()');
                                if (position.coords.latitude &&
                                    position.coords.longitude && !$scope['propData']['Lat'].val && !$scope['propData']['Lon'].val) {
                                    console.log('$scope.getLocation() @ %s,%s', position.coords.latitude, position.coords.longitude);
                                    $scope.$apply(function () {
                                        $scope.setLatLng(position.coords.latitude, position.coords.longitude)
                                    })
                                }
                            });
                        }
                    };

                    $scope.setLatLng = function (lat, lng) {
                        console.log('$scope.setLatLng(%s, %s)', lat, lng);
                        var latKey = $scope['propData']['Lat'].key,
                            lngKey = $scope['propData']['Lon'].key;
                        $scope['propData']['Lat'].val = parseFloat(lat);
                        $scope['propData']['Lon'].val = parseFloat(lng);
                        $scope.setField(latKey, $scope['propData']['Lat']);
                        $scope.setField(lngKey, $scope['propData']['Lon']);
                    };

                    $scope.generateLocation = function () {
                        return {
                            lat: parseFloat($scope['propData']['Lat'].val || $scope['propData']['Lat'].example || $scope['propData']['Lat'].defaultVal),
                            lng: parseFloat($scope['propData']['Lon'].val || $scope['propData']['Lon'].example || $scope['propData']['Lon'].defaultVal)
                        }
                    };

                    $scope.onDestroy = function () {
                        console.log('$scope.onDestroy()');
                        google.maps.event.removeListener($scope.clickListener);
                        $scope.$watchMapHandler();
                        $scope.$watchDataHandler();
                    };


                    function init() {
                        console.log('$scope: %o | propData: %o', $scope, $scope['propData']);
                        $scope.id = '';
                        $scope.map = {
                            mapTypeId: google.maps.MapTypeId.ROADMAP,
                            zoom: $scope.zoom || 8,
                            scrollwheel: false,
                            zoomControl: true,
                            mapTypeControl: true,
                            disableDoubleClickZoom: true,
                            streetViewControl: false
                        };
                        $timeout(function(){
                            initializeGoogleMaps();
                        });
                    }

                    function initializeGoogleMaps() {
                        var map = new google.maps.Map($element.find('.google-maps')[0], $scope.map),
                            loc = $scope.generateLocation(),
                            marker = new google.maps.Marker({
                                position: new google.maps.LatLng(loc.lat, loc.lng),
                                map: map,
                                title: 'Location'
                            }),
                            markerHTMLContent = "",
                            infowindow = new google.maps.InfoWindow({
                                content: markerHTMLContent
                            });
                        console.log('initializing map to (%o, %o)', loc.lat, loc.lng);
                        $scope.markerObj = marker;
                        $scope.mapObj = map;

                        $scope.updateMapView = function () {
                            var loc = $scope.generateLocation();
                            console.log('$scope.updateMapView(%o, %o)', loc.lat, loc.lng);
                            var newCenter = new google.maps.LatLng(loc.lat, loc.lng);
                            $scope.markerObj.setPosition(newCenter);
                            $scope.mapObj.panTo(newCenter);
                        };

                        $scope.$watchMapHandler = $scope.$watchGroup(['propData.Lat.val', 'propData.Lon.val'], function (newValue, oldValue) {
                            console.log('map[%s] changed: %o', $scope.id, arguments);
                            if (newValue[0] && newValue[1]) $scope.updateMapView();
                        });

                        $scope.$watchDataHandler = $scope.$watchGroup([
                            'petData.' + $scope['propData']['Lat'].key + '.val',
                            'petData.' + $scope['propData']['Lon'].key + '.val'
                        ], function (newValue, oldValue) {
                            console.log('map[%s] changed: %o', $scope.id, arguments);
                            if (newValue[0] && newValue[1]) {
                                $scope.setLatLng(newValue[0], newValue[1]);
                                $scope.updateMapView();
                            }
                        });


                        // $scope.onMarkerClick = function () {
                        //     infowindow.open(map, marker);
                        // };

                        // $scope.clickListener = google.maps.event.addListener(marker, 'click', $scope.onMarkerClick);
                        $scope.clickListener = google.maps.event.addListener(map, "dblclick", function (event) {
                            console.log('dblclick triggered.');
                            // display the lat/lng in your form's lat/lng fields
                            $scope.$apply(function () {
                                $scope.setLatLng(event.latLng.lat(), event.latLng.lng());
                            });
                        });

                        $scope['propData']['Lat'].val = $scope['propData']['Lat'].val || loc.lat;
                        $scope['propData']['Lon'].val = $scope['propData']['Lon'].val || loc.lng;
                        $scope.askForLocation();
                    }

                    googleService.onGoogleReady(init);
                }],
            link: function (scope, element, attributes) {
                // When the destroy event is triggered, check to see if the above
                // data is still available.
                if (scope.onDestroy) scope.$on("$destroy", scope.onDestroy);
            }
        }
    }]);
});