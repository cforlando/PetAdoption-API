var ngApp = require('ngApp');
var _ = require('lodash');

ngApp.service('request', function ($http, $mdToast) {
    var timeoutLimit = 10 * 1000;

    Request.onTimeout = function () {
        $mdToast.show($mdToast.simple().textContent("Poor connection detected"));
    };

    Request.get = function () {
        var self = this;
        var timeoutId = setTimeout(function () {
            self.onTimeout();
        }, timeoutLimit);

        return $http.get.apply($http, arguments)
            .then(function (response) {
                clearTimeout(timeoutId);
                return Promise.resolve(response);
            })
            .catch(function (response) {
                var statusCode = parseInt(response.status);

                clearTimeout(timeoutId);
                switch (statusCode) {
                    case 401:
                        // location.href = '/auth/google';
                        $mdToast.show($mdToast.simple().textContent("User not authorized"));
                        break;
                    default:
                        if (statusCode >= 400) {
                            $mdToast.show($mdToast.simple().textContent("Cannot connect to server"));
                        }
                }

                return Promise.reject(response);
            });
    };

    Request.post = function () {
        var self = this;
        var timeoutId = setTimeout(function () {
            self.onTimeout();
        }, timeoutLimit);

        return $http.post.apply($http, arguments)
            .then(function (response) {
                clearTimeout(timeoutId);
                return Promise.resolve(response);
            })
            .catch(function (response) {
                var statusCode = parseInt(response.status);

                clearTimeout(timeoutId);
                switch (statusCode) {
                    case 401:
                        location.href = '/auth/google';
                        break;
                }

                if (statusCode >= 400) {
                    $mdToast.show($mdToast.simple().textContent("Cannot connect to server"));
                    return Promise.reject(response);
                }

                return Promise.reject(response);
            });
    };

    return Request;
});

module.exports = ngApp;
