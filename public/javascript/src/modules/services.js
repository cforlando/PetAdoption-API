define([
    'require',
    'underscore',
    'ngApp'
], function (require) {
    var ngApp = require('ngApp'),
        _ = require('underscore');

    var dataParserService = ngApp.service('dataParserService', function () {
        this.parseResponseData = function (responseData) {
            var _data = {};
            _.forEach(responseData, function (propData, propName, props) {
                if (!_data[propName]) _data[propName] = {};
                
                if (propData['type'] == 'Date') {
                    // handle special case for date
                    _data[propName].val = new Date(propData['val']);
                    if(isNaN( _data[propName].val.getTime() )){
                        _data[propName].val = new Date();
                    }
                } else {
                    // TODO remove autofill with example
                    _data[propName].val = propData.val || propData.default || propData.example;
                }
            });
            return _data;
        };

        return this;
    });

    return dataParserService;
});