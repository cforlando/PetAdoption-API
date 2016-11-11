var angular = require('angular'),
    ngRoute = require('ng-route'),
    slickCarousel = require('angular-slick-carousel'),
    ngMessages = require('ng-messages'),
    ngMaterial = require('ng-material');

var ngApp = angular.module('cfo-pet-adoption-data-entry', ['ngMaterial', 'ngMessages', 'ngRoute', 'slickCarousel'])
    .config(function ($mdThemingProvider) {
        $mdThemingProvider.theme('default')
            .primaryPalette('cyan', {
                'default': '800'
            })
            .accentPalette('teal', {
                'default': '900'
            });
    });

// ngApp.config(['$compileProvider', function ($compileProvider) {
//     $compileProvider.debugInfoEnabled(false);
// }]);

console.log('loading ng-app: %o', ngApp);
module.exports = ngApp;
