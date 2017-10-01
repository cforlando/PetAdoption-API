var ngApp = require('ngApp');
var _ = require('lodash');

ngApp.service('request', function ($http, uiService) {
    var timeoutLimit = 10 * 1000;

    this.onTimeout = function () {
        uiService.showMessage("Poor connection detected");
    };

    this.get = function () {
        var self = this;
        var timeoutId = setTimeout(function () {
            self.onTimeout();
        }, timeoutLimit);

        uiService.showLoading();
        return $http.get.apply($http, arguments)
            .then(function (response) {
                clearTimeout(timeoutId);
                uiService.hideLoading();
                return Promise.resolve(response);
            })
            .catch(function (response) {
                var statusCode = parseInt(response.status);

                clearTimeout(timeoutId);
                uiService.hideLoading();
                switch (statusCode) {
                    case 401:
                        // location.href = '/auth/google';
                        uiService.showError("User not authorized");
                        break;
                    default:
                        if (statusCode >= 400) {
                            uiService.showError("Cannot connect to server");
                        }
                }

                return Promise.reject(response);
            });
    };

    this.post = function () {
        var self = this;
        var timeoutId = setTimeout(function () {
            self.onTimeout();
        }, timeoutLimit);

        uiService.showLoading();
        return $http.post.apply($http, arguments)
            .then(function (response) {
                clearTimeout(timeoutId);
                uiService.hideLoading();
                return Promise.resolve(response);
            })
            .catch(function (response) {
                var statusCode = parseInt(response.status);

                clearTimeout(timeoutId);
                uiService.hideLoading();
                switch (statusCode) {
                    case 401:
                        location.href = '/auth/google';
                        break;
                }

                if (statusCode >= 400) {
                    uiService.showError("Cannot connect to server");
                    return Promise.reject(response);
                }

                return Promise.reject(response);
            });
    };

    return this;
});

module.exports = ngApp;
