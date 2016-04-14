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
                    if (_.isDate(propData['val'])) {
                        _data[propName].val = propData['val']
                    } else if (_.isDate(propData['defaultValue'])) {
                        _data[propName].val = propData['defaultValue']
                    } else {
                        _data[propName].val = new Date();
                    }
                } else {
                    _data[propName].val = responseData[propName].val || responseData[propName].defaultValue;
                }
            });
            return _data;
        };

        return this;
    });

    return dataParserService;
});