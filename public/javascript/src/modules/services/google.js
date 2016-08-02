define([
    'require',
    'ngApp'
], function(require){

    return require('ngApp').service('googleService', function() {
        var TIMEOUT = 10000,
            POLL_FREQUENCY = 2000,
            queue = [],
            googleCheckInterval,
            googleCheckTimeout;

        function isGoogleInit() {
            return window.google && google.maps;
        }

        function execQueue() {
            while (queue.length > 0) {
                queue[0].callback.apply(queue[0].options.context, queue[0].options.args);
                queue.shift();
            }
        }

        function wait() {
            googleCheckInterval = setInterval(function () {
                if (isGoogleInit()) {
                    clearTimeout(googleCheckTimeout);
                    clearInterval(googleCheckInterval);
                    execQueue();
                }
            }, POLL_FREQUENCY);

            googleCheckTimeout = setTimeout(function () {
                clearInterval(googleCheckTimeout);
                console.error('Could not load google maps');
            }, TIMEOUT);
        }

        this.isGoogleReady = isGoogleInit;
        this.onGoogleReady = function (callback, options) {
            queue.push({callback: callback, options: options || {}});
            if (isGoogleInit()) {
                execQueue();
            } else {
                wait();
            }
        };

        return this;
    })
});