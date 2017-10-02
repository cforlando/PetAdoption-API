var ngApp = require('ngApp');
var _ = require('lodash');
var angular = require('angular');

console.log('loading app controller w/ %o', ngApp);

module.exports = ngApp.controller('appController', function ($scope, request, $mdToast, $location, userService) {
    angular.element('.loading-text').remove();

    $scope.sideNav = {
        isOpen: false
    };

    $scope.resetActionMenu = function(){
        $scope.actionMenu = {actions : []};
    };

    $scope.login = function () {
        location.href = '/auth/google';
    };

    $scope.showAnimalSearch = function () {
        $location.path('/pets/');
        $scope.closeSidebar();
    };

    $scope.showAnimalEditForm = function () {
        $location.path('/pets/new');
        $scope.closeSidebar();
    };

    /**
     *
     * @param {Animal} animal
     */
    $scope.editPet = function (animal) {
        $location.path('/pets/edit/' + animal.getSpeciesName() + '/' + animal.getId());
    };

    $scope.editProp = function (speciesName, propData) {
        $location.path('species/' + speciesName + '/property/' + propData.key);
    };

    $scope.showSpeciesSearch = function () {
        $location.path('/species');
        $scope.closeSidebar();
    };

    $scope.showSpecies = function (speciesName) {
        $location.path('/species/' + speciesName);
        $scope.closeSidebar();
    };

    $scope.showSettings = function () {
        $location.path('/settings');
        $scope.closeSidebar();
    };

    $scope.onTabSelected = function (tab) {
        $scope.$broadcast('change:tab', tab);
    };

    $scope.toggleMenu = function ($mdOpenMenu, ev) {
        $mdOpenMenu(ev);
    };

    $scope.toggleSidebar = function () {
        $scope.sideNav.isOpen = !$scope.sideNav.isOpen;
    };

    $scope.closeSidebar = function () {
        $scope.sideNav.isOpen = false;
    };

    $scope.refreshApp = function () {
        $scope.$broadcast('reload:app');
    };

    $scope.toggleActionMenu = function () {
        console.log('$scope.$broadcast(toggle:action-menu)');
        $scope.$broadcast('toggle:action-menu');
    };

    (function init() {
        $scope.resetActionMenu();

        $scope.$on('$routeChangeSuccess', function(next, current) {
            $scope.resetActionMenu();
        });

        userService.getCurrentUser()
            .then(function (user) {
                $scope.user = user;
            })
    })()
});
