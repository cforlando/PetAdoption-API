var angular = require('angular');
var ngRoute = require('ng-route');
var ngDragDrop = require('angular-dragdrop');
var slickCarousel = require('angular-slick-carousel');
var ngMessages = require('ng-messages');
var ngMaterial = require('ng-material');
// global dependencies
require('jquery-ui');
require('touch-punch');
require('jquery-file-input-urls');

var ngApp = angular.module('cfo-pet-adoption-data-entry', ['ngMaterial', 'ngMessages', 'ngRoute', 'slickCarousel', 'ngDragDrop'])
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
