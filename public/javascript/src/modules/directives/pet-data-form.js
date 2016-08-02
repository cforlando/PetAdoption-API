define([
    'require',
    'underscore',
    'text!./views/pet-form.html',
    'ngApp'
], function (require) {
    var _ = require('underscore'),
        ngApp = require('ngApp');

    return ngApp.directive('petDataForm', function () {
        return {
            restrict: 'C',
            template : require('text!./views/pet-form.html'),
            replace : true,
            controller: ['$scope', '$element', '$http', 'dataParserService',
                function ($scope, $element, $http, dataParserService) {
                    console.log("$scope: %o", $scope);


                    
                    $scope.getSpeciesList(function(){
                        $scope.setField('species', _.extend({}, $scope.petData.species, {val : $scope.speciesList[0]}))
                    });

                    $scope.isSelectInput = function(propData){
                        switch(propData.key){
                            case 'species':
                                return true;
                                break;
                            default:
                                return (propData.valType == "Boolean")
                        }
                    };

                    $scope.isDateField = function(propData){
                        return (propData.valType == "Date")
                    };

                    $scope.isImagesField = function(propData){
                        return (propData.valType == "[Image]")
                    };

                    $scope.isLocationField = function(propData){
                        return (propData.valType == "Location")
                    };

                    $scope.isParagraphField = function(propData){
                        return (propData.key == "description")
                    };

                    $scope.isAutocompleteField = function(propData){
                        switch(propData.key){
                            case 'petId':
                            case 'description':
                            case 'species':
                                return false;
                                break;
                            default:
                                return (propData.valType == "String")
                        }
                    };

                    /**
                     *
                     * @param {Object} model
                     */
                    function updateProperties(model){
                        var renderData = dataParserService.formatRenderData(model);
                        console.log('rendering: %o', renderData);
                        $scope.properties = renderData;
                    }

                    $scope.$on('update:petData', _.debounce(function(){
                        updateProperties($scope.petData);
                    }, 500));
                }]
        };
    });
});