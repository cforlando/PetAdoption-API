define(
    [
        'require',
        'domReady!',
        '$elements',
        'ngApp'
    ]
    ,
    function (require) {
        var $window = require('$elements').window,
            ngApp = require('ngApp');
        return ngApp.directive('googleMaps', function () {
            return {
                restrict: 'C',
                controller: ['$scope', '$element', function ($scope, $element) {
                    $element.on('click', function () {
                        $scope.fab.isOpen = !$scope.fab.isOpen;
                    });
                    $scope.mapOptions = {
                        center: {
                            lat: 28.513651,
                            lng: -81.466219
                        },
                        mapTypeId: google.maps.MapTypeId.ROADMAP,
                        zoom: 17,
                        scrollwheel: false,
                        zoomControl: false,
                        streetViewControl: false

                    };

                    $scope.mapUIConfig = {
                        addressLine1: '6150 Metrowest Blvd Suite 305B',
                        addressLine2: 'Orlando, FL 32835',
                        mapsExternalLink: 'https://www.google.com/maps/place/6150+Metrowest+Blvd+%23305b,+Orlando,+FL+32835/@28.513651,-81.466219,17z/data=!3m1!4b1!4m2!3m1!1s0x88e77924273cccdb:0x38c1cefb00652b3e',
                        latitude: 28.513651,
                        longitude: -81.466219
                    };
                    if (google.maps) {
                        this.initializeGoogleMaps();
                    } else {
                        this._waitForGoogleMaps();
                    }

                    function initializeGoogleMaps() {
                        console.log('MapsView.onGoogleMapsInit(%O) | mapUIConfig: %O | mapOptions: %O', arguments, $scope.mapUIConfig, $scope.mapOptions);
                        var screenWidth = window.innerWidth || $window.width();
                        if (screenWidth == 320 || screenWidth == 375 || screenWidth == 360) {
                            // common mobile sizes
                            $scope.mapOptions.draggable = false;
                        }
                        var map = new google.maps.Map($element[0], $scope.mapOptions),
                            iconBaseURL = 'https://maps.google.com/mapfiles/kml/shapes/',
                            marker = new google.maps.Marker({
                                position: new google.maps.LatLng($scope.mapUIConfig.latitude, $scope.mapUIConfig.longitude),
                                map: map,
                                title: 'Directions'
                            }),
                            addressHTMLText = '<p>' + this.mapUIConfig.addressLine1 + '<br/>' + $scope.mapUIConfig.addressLine2 + '</p>',
                            gMapHTMLContent = "<div class='google-map-infowindow'>" +
                                "<a href='" + $scope.mapUIConfig.mapsExternalLink + "' target='_blank' >" + addressHTMLText + "</a>" +
                                "<div>",
                            infowindow = new google.maps.InfoWindow({
                                content: gMapHTMLContent
                            });

                        $scope.onMarkerClick = function () {
                            infowindow.open(map, marker);
                        };
                        $scope.clickListener = google.maps.event.addListener(marker, 'click', $scope.onMarkerClick);
                    }

                    function _waitForGoogleMaps() {
                        $scope.googleCheckInterval = setInterval(function () {
                            if (google.maps) {
                                clearTimeout($scope.googleCheckTimeout);
                                clearInterval($scope.googleCheckInterval);
                                $scope.initializeGoogleMaps();
                            }
                        }, 2000);

                        $scope.googleCheckTimeout = setTimeout(function () {
                            clearInterval($scope.googleCheckTimeout);
                        }, 10000);
                    }

                    function destroy() {
                        google.maps.event.removeListener(this.clickListener);
                    }
                }]
            }
        });


    });