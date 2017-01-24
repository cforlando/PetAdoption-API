var ngApp = require('ngApp'),
    angular = require('angular'),
    url = require('url');

ngApp.service('addressFinderService', ['googleService', function (googleService) {
    var geocoder,
        $mapsScript = angular.element("script[src*='maps.googleapis.com/maps/api/js']"),
        mapsKey = url.parse($mapsScript.attr('src')).query['key'];


    googleService.onGoogleReady(function () {
        geocoder = new google.maps.Geocoder();
    });

    function geocodeAddress(address, callback) {
        debugger;
        if (geocoder && mapsKey) {
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
        } else if (mapsKey) {
            googleService.onGoogleReady(function () {
                geocoder.geocode({'address': address}, function (results, status) {
                    console.log('geocodeAddress(%s) =', address, arguments);
                    callback.apply();
                });
            });
        } else {
            callback(null, false);
        }
    }

    this.findCoordinates = geocodeAddress;

    return this;
}]);

module.exports = ngApp;
