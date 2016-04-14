define([
    'require',
    'ng-material'
], function(require){
    var ngApp = angular.module('cfo-pet-adoption-data-entry', ['ngMaterial'])
        .config(function($mdThemingProvider) {
            $mdThemingProvider.theme('default')
                .primaryPalette('cyan',{
                    'default': '800'
                })
                .accentPalette('teal',{
                    'default': '900'
                });
        });

    console.log('init angular.');
    
    return ngApp;

});