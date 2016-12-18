var ngApp = require('ngApp');

ngApp.config([
    "$routeProvider", "$locationProvider",
    function ($routeProvider, $locationProvider) {
        $locationProvider.html5Mode(false);

        $routeProvider
            .when("/animals", {
                template: require('text!modules/views/search-animals.html')
            })
            .when("/animals/edit/:petSpecies/:petId", {
                template: require('text!modules/views/edit-animal.html')
            })
            .when("/animals/new", {
                template: require('text!modules/views/edit-animal.html')
            })
            .when("/species", {
                template: require('text!modules/views/search-species.html')
            })
            .when("/species/:speciesName", {
                template: require('text!modules/views/view-species.html')
            })
            .when("/species/:speciesName/:propName", {
                template: require('text!modules/views/edit-species-prop.html')
            })
            .otherwise({redirectTo: "/animals"})
    }]);

console.log('init router.');

module.exports = ngApp;
