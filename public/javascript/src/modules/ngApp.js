define([
    'require',
    'ng-route',
    'ng-material'
], function(require){
    var ngApp = angular.module('cfo-pet-adoption-data-entry', ['ngMaterial', 'ngRoute'])
        .config(function($mdThemingProvider) {
            $mdThemingProvider.theme('default')
                .primaryPalette('cyan',{
                    'default': '800'
                })
                .accentPalette('teal',{
                    'default': '900'
                });
        });

    // ngApp.config(['$compileProvider', function ($compileProvider) {
    //     $compileProvider.debugInfoEnabled(false);
    // }]);

    console.log('init angular.');
    
    return ngApp;

});