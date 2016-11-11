define([
    'require',
    'angular',
    'underscore',
    'ngApp'
], function (require) {
    var angular = require('angular'),
        ngApp = require('ngApp'),
        _ = require('underscore');

    ngApp.controller('userController', [
        '$scope', 'request',
        function ($scope, request) {
            $scope.user = {
                // Get user ID
            };


            /**
             *
             * @param propName
             */
            $scope.getUserDefault = function (propName) {
                return _.find($scope.user.defaults, {key: propName});
            };

            $scope.getUserDefaults = function(){
                return $scope.user.defaults;
            };

            /**
             *
             * @param propData
             */
            $scope.addUserDefault = function (propData) {
                $scope.user.defaults.push(_.pick(propData, ['key', 'val']));
            };

            /**
             *
             * @param propData
             */
            $scope.updateUserDefault = function(propData){
                var propDefaultIndex = _.findIndex($scope.user.defaults, function(propDefaultData){
                    return propDefaultData.key == propData.key;
                });
                $scope.user.defaults[propDefaultIndex] = _.pick(propData, ['key', 'val']);
            };

            /**
             *
             * @param propData
             */
            $scope.setUserDefault = function (propData) {
                var currentDefault = $scope.getUserDefault(propData.key);
                if (!currentDefault) {
                    $scope.addUserDefault(propData);
                } else {
                    $scope.updateUserDefault(propData);
                }
            };

            /**
             * @param {Object} options
             * @param {Function} options.done
             **/
            $scope.saveUser = function (options) {
                var _options = _.defaults(options, {});
                request.post('/api/v1/user/save', $scope.user).then(
                    function success() {
                        if (_options.done) _options.done(null, $scope.user);
                    },
                    function failure() {
                        if (_options.done) _options.done(new Error('Could not save user'));
                    }
                );
            };


            /**
             * @param {Object} options
             * @param {Function} options.done
             **/
            $scope.getUserData = function (options) {
                var _options = _.defaults(options, {});
                request.get('/api/v1/user').then(
                    function success(response) {
                        $scope.user = response.data;
                        if (_options.done) _options.done(null, $scope.user);
                    },
                    function failure() {
                        if (_options.done) _options.done(new Error('Could not load user'));
                    }
                );
            };

            function init() {
                if (angular.element('.main-view').length > 0){
                    console.log("userController - fetching user data");
                    $scope.getUserData({
                        done: function(err, userData){
                            console.log('getUserData() = %o', arguments);
                        }
                    })
                }
            }

            init();
        }]);
});
