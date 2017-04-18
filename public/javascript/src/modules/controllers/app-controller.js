var ngApp = require('ngApp');
var _ = require('lodash');
var angular = require('angular');

console.log('loading app controller w/ %o', ngApp);

module.exports = ngApp.controller('appController', function ($scope, request, $mdToast, $location, userService) {
    console.log('init app controller');
    angular.element('.loading-text').remove();
    $scope.loadingQueue = {
        length: 0
    };

    $scope.sideNav = {
        isOpen: false
    };

    $scope.login = function () {
        location.href = '/auth/google';
    };

    /**
     *
     * @param {String} errorMessage
     */
    $scope.showError = function (errorMessage) {
        return $mdToast.show($mdToast.simple().textContent(errorMessage || 'Sorry. Try Again :-('));
    };
    /**
     *
     * @param {String} message
     */
    $scope.showMessage = function (message) {
        return $mdToast.show($mdToast.simple().textContent(message || 'Success'))
            .catch(function (err) {
                console.error('$mdToast err: %o', err)
                return Promise.resolve();
            });
    };

    $scope.showLoading = function () {
        $scope.loadingQueue.length++;
        return Promise.resolve();
    };

    $scope.hideLoading = function () {
        if ($scope.loadingQueue.length > 0) $scope.loadingQueue.length--;
        return Promise.resolve();
    };

    $scope._persistCurrentPath = function () {
        $location.path($location.path());
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
        userService.getCurrentUser()
            .then(function (user) {
                $scope.user = user;
            })
    })()
})
