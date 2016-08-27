define([
    'require',
    'text!./views/pet-list.html',
    'ngApp'
], function(require) {
    var ngApp = require('ngApp');
    ngApp.directive('petList', function(){
        return {
            restrict: 'EC',
            template: require('text!./views/pet-list.html')
        }
    });
});