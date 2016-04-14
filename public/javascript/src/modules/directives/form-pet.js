define(['ngApp'], function(ngApp){

    return ngApp.directive('petForm', function () {
        return {
            restrict: 'C',
            controller: ['$scope', '$element', '$http', '$mdToast', function ($scope, $element, $http, $mdToast) {
                $scope.$on('submit', function () {
                    var _data = {};
                    
                    for (var prop in $scope.petData) {
                        if ($scope.petData.hasOwnProperty(prop)) {
                            _data[prop] = $scope.petData[prop]['val'] || $scope.petData[prop]['default'] || $scope.petData[prop]['example'];
                        }
                    }
                    
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
});