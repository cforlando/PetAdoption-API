define([
    'require',
    'ngApp'
], function (require) {
    var ngApp = require('ngApp');


    var router = ngApp.config(["$routeProvider", function ($routeProvider) {
        return $routeProvider
            .when("/", {controller: 'petDataController'})
            .when("/search", {controller: 'petDataController'})
            .otherwise({redirectTo: "/"})
    }]);

    //console.log('init router.');

    return {
        router: router
    };

});