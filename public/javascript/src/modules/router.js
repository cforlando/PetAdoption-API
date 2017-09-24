var angular = require('angular');
var ngApp = require('ngApp');

ngApp.config(function ($routeProvider, $locationProvider) {
    $locationProvider.html5Mode(false);

    $routeProvider
        .when('/pets', {
            template: require('raw-loader!modules/views/search-animals.html')
        })
        .when('/pets/edit/:speciesName/:petId', {
            template: require('raw-loader!modules/views/edit-animal.html')
        })
        .when('/pets/new', {
            template: require('raw-loader!modules/views/edit-animal.html')
        })
        .when('/species', {
            template: require('raw-loader!modules/views/search-species.html')
        })
        .when('/species/:speciesName', {
            template: require('raw-loader!modules/views/view-species.html')
        })
        .when('/species/:speciesName/property/:propName', {
            template: require('raw-loader!modules/views/edit-species-prop.html')
        })
        .otherwise({
            redirectTo: function () {
                // roundabout way of determining if user is logged in
                if (angular.element('.main-view').length > 0) {
                    return '/pets';
                }

                return '/';
            }
        })
});

module.exports = ngApp;
