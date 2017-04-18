var angular = require('angular');

var deps = [
    require('ng-router'),
    require('ng-filters'),
    require('ng-services'),
    require('ng-controllers'),
    require('ng-directives')
];

console.log('app loaded w/ %o on %o', deps, document);
module.exports = angular.bootstrap(document, ['cfo-pet-adoption-data-entry']);

