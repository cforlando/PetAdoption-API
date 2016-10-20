require([
    'require',
    'domReady!',
    'ngApp',
    'ng-router',
    'ng-services',
    'ng-controllers',
    'ng-directives'
], function (require) {
    angular.bootstrap(document, ['cfo-pet-adoption-data-entry']);
});
