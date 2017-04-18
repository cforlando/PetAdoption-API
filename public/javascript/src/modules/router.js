var ngApp = require('ngApp');

ngApp.config([
    "$routeProvider", "$locationProvider",
    function ($routeProvider, $locationProvider) {
        $locationProvider.html5Mode(false);

        $routeProvider
            .when('/pets', {
                template: require('raw!modules/views/search-animals.html')
            })
            .when('/pets/edit/:speciesName/:petId', {
                template: require('raw!modules/views/edit-animal.html')
            })
            .when('/pets/new', {
                template: require('raw!modules/views/edit-animal.html')
            })
            .when('/species', {
                template: require('raw!modules/views/search-species.html')
            })
            .when('/species/:speciesName', {
                template: require('raw!modules/views/view-species.html')
            })
            .when('/species/:speciesName/property/:propName', {
                template: require('raw!modules/views/edit-species-prop.html')
            })
            .otherwise({redirectTo: "/pets"})
    }]);

module.exports = ngApp;
