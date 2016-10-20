
define([
    'require',
    'underscore',
    'ngApp'
], function(require) {
    var ngApp = require('ngApp'),
        _ = require('underscore');

    return ngApp.service('request', ['$http', '$mdToast', function($http, $mdToast){
        function SmartPromise(requestPromise){
            var self = this;

            this.timeoutLimit = 10 * 1000;

            this.onTimeout = function(){
                $mdToast.show($mdToast.simple().textContent("Poor connection detected"));
            };

            this.startTimeoutWatch = function(){
                this.timeoutId = setTimeout(function(){
                    self.onTimeout();
                }, this.timeoutLimit);
            };

            this.quitTimeoutWatch = function(){
                clearTimeout(self.timeoutId);
            };

            this.onSuccess = function success(response){
                self.quitTimeoutWatch();
                self.successCallback.apply(null, arguments);
            };

            this.onFailure = function (response){
                self.quitTimeoutWatch();
                if(response.status == 401){
                    location.href = '/auth/google';
                } else if(response.status == 503){
                    $mdToast.show($mdToast.simple().textContent("Cannot connect to server"));
                }
                else {
                   self.failureCallback.apply(null, arguments);
                }
            };


            this.startTimeoutWatch();
            requestPromise.then(this.onSuccess, this.onFailure);

            this.assignResolutions = function(successCallback, failureCallback){
                self.successCallback = successCallback;
                self.failureCallback = failureCallback;
            };

            return {
                then: self.assignResolutions 
            };
        }

        return {
            get: function(){
                var requestPromise = $http.get.apply($http, arguments);
                return new SmartPromise(requestPromise);
            },
            post: function(){ 
                var requestPromise = $http.post.apply($http, arguments);
                return new SmartPromise(requestPromise);
            }
        };
    }]);
});
