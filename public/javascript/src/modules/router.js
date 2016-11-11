define([
    'require',
    'ng-controllers',
    'text!modules/views/search-animals.html',
    'text!modules/views/edit-animal.html',
    'text!modules/views/search-species.html',
    'text!modules/views/view-species.html',
    'text!modules/views/edit-species-prop.html',
    'ngApp'
], function (require) {
    var ngApp = require('ngApp');


    var router = ngApp.config(["$routeProvider", function ($routeProvider) {
        return $routeProvider
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

    return {
        router: router
    };

});