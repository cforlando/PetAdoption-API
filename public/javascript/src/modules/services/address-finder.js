define([
    'require',
    'underscore',
    'modules/services/google',
    'ngApp'
], function (require) {
    var ngApp = require('ngApp'),
        _ = require('underscore');

    return ngApp.service('addressFinderService', ['googleService', function (googleService) {
        var geocoder;


        googleService.onGoogleReady(function () {
            geocoder = new google.maps.Geocoder();
        });

        function geocodeAddress(address, callback) {
            if (!geocoder) {
                googleService.onGoogleReady(function () {
                    geocoder.geocode({'address': address}, function (results, status) {
                        console.log('geocodeAddress(%s) =', address, arguments);
                        callback.apply();
                    });
                });
            } else {
                geocoder.geocode({'address': address}, function (results, status) {
                    console.log('geocodeAddress(%s) =', address, arguments);
                    switch (status) {
                        case 'OK':
                            var locationResult = results[0];
                            callback.call(null, {
                                address : locationResult['formatted_address'],
                                lat: locationResult.geometry.location.lat(),
                                lng: locationResult.geometry.location.lng()
                            });
                            break;
                        case 'ZERO_RESULTS':
                        default:
                            callback.call(null, false);
                            break;
                    }
                });
            }
        }

        this.findCoordinates = geocodeAddress;

        return this;
    }]);
});