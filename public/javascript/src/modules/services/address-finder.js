var ngApp = require('ngApp'),
    angular = require('angular'),
    url = require('url');

ngApp.service('addressFinderService', ['googleService', function (googleService) {
    var $mapsScript = angular.element("script[src*='maps.googleapis.com/maps/api/js']"),
        mapsKey = url.parse($mapsScript.attr('src')).query['key'];

    /**
     *
     * @param {String} address
     * @returns {Promise}
     */
    this.findCoordinates = function (address) {
        if (!mapsKey) {
            return Promise.reject(new Error('Maps key not provided'));
        }

        return googleService.initGoogleServices()
            .then(function () {
                var geocoder = new google.maps.Geocoder();

                return new Promise(function (resolve, reject) {
                    geocoder.geocode({'address': address}, function (results, status) {
                        console.log('geocodeAddress(%s) =', address, arguments);
                        switch (status) {
                            case 'OK':
                                var locationResult = results[0];
                                resolve({
                                    address: locationResult['formatted_address'],
                                    lat: locationResult.geometry.location.lat(),
                                    lng: locationResult.geometry.location.lng()
                                });
                                return;
                            case 'ZERO_RESULTS':
                            default:
                                reject(new Error('No results found'));
                                return;
                        }
                    });
                })
            });

    };

    return this;
}]);

module.exports = ngApp;
