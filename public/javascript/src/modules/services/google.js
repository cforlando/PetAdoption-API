define([
    'require',
    'ngApp'
], function (require) {

    return require('ngApp').service('googleService', function () {
        var self = this;
        var googleCheckInterval;
        var googleCheckTimeout;

        this.TIMEOUT = 10 * 1000;
        this.POLL_FREQUENCY = 1000;

        function isGoogleInit() {
            return window.google && window.google.maps;
        }

        function wait() {
            return new Promise(function (resolve, reject) {
                googleCheckTimeout = setTimeout(function () {
                    var timeoutEror = new Error('Could not load google maps');

                    clearInterval(googleCheckTimeout);
                    console.error(timeoutEror);

                    reject(timeoutEror);
                }, self.TIMEOUT);

                googleCheckInterval = setInterval(function () {
                    if (isGoogleInit()) {

                        clearTimeout(googleCheckTimeout);
                        clearInterval(googleCheckInterval);

                        resolve();
                    }
                }, self.POLL_FREQUENCY);
            });
        }

        this.initGoogleServices = function () {
            return wait();
        };

        return this;
    })
});