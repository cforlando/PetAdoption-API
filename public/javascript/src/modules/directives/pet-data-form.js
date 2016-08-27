define([
    'require',
    'underscore',
    'text!./views/pet-form.html',
    'ngApp'
], function(require) {
    var _ = require('underscore'),
        ngApp = require('ngApp');

    return ngApp.directive('petDataForm', function() {
        return {
            restrict: 'EC',
            template: require('text!./views/pet-form.html'),
            scope: true,
            replace: true
        };
    });
});