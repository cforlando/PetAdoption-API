var cfoApp = angular.module('cfo-pet-adoption-data-entry', ['ngMaterial']);


cfoApp.controller('petDataController', ['$scope', '$http', function ($scope, $http) {
    $http.get('/api/v1/model/dog').then(
        function success(response) {
            $scope['petData'] = response.data;
            for(var prop in $scope['petData']){
                if($scope['petData'].hasOwnProperty(prop)){
                    $scope['petData'][prop].val = $scope['petData'][prop].default || $scope['petData'][prop].example;
                }
            }
        },
        function failure() {
            $scope['petData'] = {};
            $mdToast.show($mdToast.simple().textContent("Sorry. Can't get any info from server."));
        });
    $scope['fab'] = {
        isOpen: false
    }
}]);
cfoApp.directive('fabToggle', function () {
    return {
        restrict: 'C',
        controller: ['$scope', '$element', function ($scope, $element) {
            $element.on('click', function () {
                $scope.fab.isOpen = !$scope.fab.isOpen;
            })
        }]
    }
});

cfoApp.directive('btnClearForm', function () {
    return {
        restrict: 'C',
        controller: ['$scope', '$element', function ($scope, $element) {
            $element.on('click', function () {
                for (var prop in $scope.petData) {
                    if ($scope.petData.hasOwnProperty(prop)) {
                        $scope.petData[prop]['example'] = null;
                    }
                }
            })
        }]
    }
});

cfoApp.directive('btnReuseForm', function () {
    return {
        restrict: 'C',
        controller: ['$scope', '$element', function ($scope, $element) {
            $element.on('click', function () {
                $scope.petData['petId']['example'] = '';
                if ($scope.petData['hashId']) $scope.petData['hashId']['example'] = '';
            })
        }]
    }
});


cfoApp.directive('inputSubmit', function () {
    return {
        restrict: 'C',
        controller: ['$scope', '$element', function ($scope, $element) {
            $element.on('click', function () {
                console.log('submit');
                $scope.$emit('submit');
            })
        }]
    };
});
cfoApp.directive('petForm', function () {
    return {
        restrict: 'C',
        controller: ['$scope', '$element', '$http', '$mdToast', function ($scope, $element, $http, $mdToast) {
            $scope.$on('submit', function () {
                var _data = {};
                for (var prop in $scope.petData) {
                    if ($scope.petData.hasOwnProperty(prop)) {
                        _data[prop] = $scope.petData[prop]['example'];
                    }
                }
                $scope.openToast = function ($event) {
                    // Could also do $mdToast.showSimple('Hello');
                };
                console.log('_data; %o', _data);
                $http.post($element.attr('action'), _data).then(
                    function success(response) {
                        if (response.data.result != 'success') {
                            showSaveError();
                            return;
                        }
                        $mdToast.show($mdToast.simple().textContent('Saved!'));
                        var _persistedData = response.data['data'];
                        console.log('_persistedData: %o', _persistedData);
                        for (var prop in _persistedData) {
                            if (_persistedData.hasOwnProperty(prop)) {
                                if ($scope.petData[prop]) {
                                    // create new field. set persisted data?
                                    $scope.petData[prop]['example'] = _persistedData[prop];
                                } else {
                                    // create new field. why not?
                                    $scope.petData[prop] = {
                                        key: prop,
                                        example: _persistedData[prop]
                                    };
                                }
                                if (prop == 'hashId') {
                                    // set petId to returned hashId
                                    $scope.petData['petId']['example'] = _persistedData[prop];
                                }
                            }
                        }
                    },
                    function failure() {
                        showSaveError()
                    }
                );

                function showSaveError() {
                    $mdToast.show($mdToast.simple().textContent('Sorry. Try Again :-('));
                }

                // $element[0].submit();

            })
        }]
    };
});