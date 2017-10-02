var angular = require('angular');
var ngApp = require('ngApp');
var _ = require('lodash');

module.exports = ngApp.directive('settingsForm', function () {
    return {
        restrict: 'C',
        template: require('raw-loader!./templates/settings-form.html'),
        controller: function ($scope, $controller, userService, uiService) {
            $scope.settings = [
                {
                    key: 'loadDefaults',
                    fieldLabel: 'use defaults on creation',
                    description: 'Whether to load default values on pet creation?',
                    defaultVal: false,
                    val: userService.getUserMetaValue('loadDefaults'),
                    valType: 'boolean'
                }
            ];

            $scope.saveSettings = function () {
                $scope.settings.forEach(function (setting) {
                    userService.setUserMeta(setting.key, setting.val);
                });

                return userService.saveCurrentUser()
                    .then(function () {
                        uiService.showMessage('Settings saved');
                    })
                    .catch(function (err) {
                        console.error(err);
                        uiService.showError('Failed to save settings');
                    });
            };
        }
    }
});