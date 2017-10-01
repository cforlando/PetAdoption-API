var _ = require('lodash');
var angular = require('angular');
var ngApp = require('ngApp');

module.exports = ngApp.directive('autoInput', function () {
    return {
        restrict: 'EC',
        template: require('raw-loader!./templates/auto-input.html'),
        scope: {
            propData: '=params',
            type: '=',
            initWithDefaults: '=',
            hasDefault: '='
        },
        controller: function ($scope, animalDataService, userService, uiService) {
            $scope.getType = function (propData) {
                return $scope.type || animalDataService.getPropType(propData || $scope.propData);
            };

            $scope.getSelectOptionLabel = function (option) {
                if (option === true) {
                    return 'Yes';
                } else if (option === false) {
                    return 'No'
                } else {
                    return option;
                }

            };

            /**
             *
             * @param {Object} propData
             * @return {boolean}
             */
            $scope.isDefaultAllowed = function (propData) {
                return angular.isDefined($scope.hasDefault) ? $scope.hasDefault : propData.key !== 'species';
            };

            /**
             *
             * @param {Object} prop
             * @returns {boolean}
             */
            $scope.isResetable = function (prop) {
                var propData = prop || $scope.propData;
                switch (propData.valType && propData.valType.toLowerCase()) {
                    case 'string':
                    case 'number':
                    case 'date':
                        return true;
                    default:
                        return false;
                }
            };

            /**
             *
             * @param {Object} propData
             * @returns {Promise}
             */
            $scope.setAsDefault = function (propData, options) {
                var opts = _.defaults(options, {
                    visibleNotification: true
                });

                userService.setUserDefault(propData);

                return userService.saveCurrentUser()
                    .then(function () {
                        if (opts.visibleNotification) {
                            uiService.showMessage("Saved default for '" + propData.key + "'");
                        }
                    })
                    .catch(function (err) {
                        uiService.showError("Could not save default for '" + propData.key + "'");
                        return Promise.reject(err);
                    })
            };

            /**
             *
             * @param {Object} [options]
             * @param {Boolean} [options.showNotification=true]
             * @returns {Promise}
             */
            $scope.resetFromDefault = function (options) {
                var opts = Object.assign({showNotification: true}, options);
                var userDefault = userService.getUserDefault($scope.propData.key);

                $scope.propData.val = userDefault ? userDefault.val : $scope.propData.defaultVal;

                if (opts.showNotification) {
                    uiService.showMessage("Reset '" + $scope.propData.key + "'");
                }
            };

            (function () {
                if ($scope.initWithDefaults && !angular.isDefined($scope.propData.val)) {
                    $scope.resetFromDefault({showNotification: false});
                }
            })()
        }
    }
});
