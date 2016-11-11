define([
    'require',
    'underscore',
    'ngApp'
], function(require){
    var ngApp = require('ngApp'),
        _ = require('underscore');

    return ngApp.service('request', ['$http', '$mdToast', function ($http, $mdToast) {
        function SmartRequestThenable(requestPromise) {

            this.timeoutLimit = 10 * 1000;

            this.startTimeoutWatch();

            requestPromise.then(this.onSuccess.bind(this), this.onFailure.bind(this));

            return {
                then: this.assignCallbacks.bind(this)
            };
        }

        SmartRequestThenable.prototype = {
            onTimeout: function () {
                $mdToast.show($mdToast.simple().textContent("Poor connection detected"));
            },

            startTimeoutWatch: function () {
                var self = this;
                this.timeoutId = setTimeout(function(){
                    self.onTimeout();
                }, this.timeoutLimit);
            },

            quitTimeoutWatch: function () {
                clearTimeout(this.timeoutId);
            },

            onSuccess: function success(response) {
                this.quitTimeoutWatch();
                if (this.successCallback) this.successCallback.apply(null, arguments);
            },

            onFailure: function (response) {
                this.quitTimeoutWatch();
                if(response.status == 401){
                    location.href = '/auth/google';
                } else if(response.status == 503){
                    $mdToast.show($mdToast.simple().textContent("Cannot connect to server"));
                } else {
                    if (this.failureCallback) this.failureCallback.apply(null, arguments);
                }
            },

            assignCallbacks: function (successCallback, failureCallback) {
                this.successCallback = successCallback;
                this.failureCallback = failureCallback;
            }
        };

        function Request() {
            var requestPromise = $http.apply($http, arguments);
            return new SmartRequestThenable(requestPromise);
        }

        Request.get = function () {
            var requestPromise = $http.get.apply($http, arguments);
            return new SmartRequestThenable(requestPromise);
        };

        Request.post = function () {
            var requestPromise = $http.post.apply($http, arguments);
            return new SmartRequestThenable(requestPromise);
        };

        return Request;
    }]);
});

