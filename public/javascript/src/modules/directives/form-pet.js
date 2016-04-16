define(['ngApp'], function (ngApp) {

    return ngApp.directive('petForm', function () {
        return {
            restrict: 'C',
            controller: ['$scope', '$element', '$http', '$mdToast', 'dataParserService',
                function ($scope, $element, $http, $mdToast, dataParserService) {
                    var $submitButton = $element.find('.input-submit');
                    $submitButton.on('click', function () {
                        console.log('submit');
                        submit();
                    });
                    console.log("listening for click on %O", $submitButton);
                    function submit() {
                        var _data = {},
                            _formData = $scope.petData[$scope.visiblePetType];
                        for (var prop in _formData) {
                            if (_formData.hasOwnProperty(prop)) {
                                _data[prop] = _formData[prop]['val'];
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
                                $scope.petData[$scope.visiblePetType] = dataParserService.parseResponseData(_persistedData);

                            },
                            function failure() {
                                showSaveError()
                            }
                        );

                        function showSaveError() {
                            $mdToast.show($mdToast.simple().textContent('Sorry. Try Again :-('));
                        }

                        // $element[0].submit();

                    }
                }]
        };
    });
});