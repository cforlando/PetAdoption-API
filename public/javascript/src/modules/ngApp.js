var angular = require('angular');
var ngRoute = require('angular-route');
var ngDragDrop = require('angular-dragdrop');
var slick = require('slick-carousel');
var slickCarousel = require('angular-slick-carousel');
var ngMessages = require('angular-messages');
var ngMaterial = require('angular-material');
var jqueryUI = require('jquery-ui');
var touchPunch = require('touch-punch');
var fileInputs = require('jquery-file-input-urls');

module.exports = angular.module('cfo-pet-adoption-data-entry', ['ngMaterial', 'ngMessages', 'ngRoute', 'slickCarousel', 'ngDragDrop'])
    .config(function ($mdThemingProvider, $compileProvider) {
        $mdThemingProvider.theme('default')
            .primaryPalette('cyan', {
                'default': '800'
            })
            .accentPalette('teal', {
                'default': '900'
            });

        if (!location.hostname.match(/^localhost$/)) {
            $compileProvider.debugInfoEnabled(false);
        }
    })
