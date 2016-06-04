define([
    'require',
    'underscore',
    'ngApp'
], function (require) {
    var ngApp = require('ngApp'),
        _ = require('underscore');

    var dataParserService = ngApp.service('dataParserService', function () {
        function parsePropValue(propData) {
            var _data = {};
            console.log('parsing %o (key: %s - type; %s)', propData, propData.key, propData.valType);
            switch (propData.valType) {
                case 'Date':
                    // handle special case for date
                    _data.val = new Date(propData.val);
                    if (isNaN(_data.val.getTime())) {
                        _data.val = new Date();
                    }
                    break;
                case 'Location':
                case 'Number':
                    if (propData.val) {
                        if (/\./.test(propData.val.toString())) {
                            // value is float
                            console.log('parsing float for %O', propData);
                            _data.val = parseFloat(propData.val);
                        } else {
                            console.log('parsing int for %O', propData);
                            // value is integer
                            _data.val = parseInt(propData.val || -1);
                        }
                    }
                    break;
                default:
                    // TODO remove autofill with example
                    _data.val = propData.val || propData.defaultVal || propData.example;
            }
            return _data;
        }

        function parsePropOptions(propData) {
            if (propData) {
                if (propData.options) {
                    propData.options = _.uniq(propData.options);
                } else {
                    console.log('propData (%s) does not have options', propData.key);
                    propData.options = [];
                }
                return propData;
            }
            return {options: null}; // use empty object value
        }

        this.convertDataToSaveFormat = function (data) {
            var _data = {};
            _.forEach(data, function (propData, propName, props) {
                _data[propName] = parsePropValue(propData).val;
            });
            return _data;
        };

        this.convertDataToModelFormat = function (data) {
            var _data = {};
            _.forEach(data, function (propData, propName, props) {
                _data[propName] = _.extend({}, propData, {
                    options: parsePropOptions(propData).options
                });
            });
            return _data;
        };

        this.parseResponseData = function (responseData) {
            var _data = {};
            _.forEach(responseData, function (propData, propName, props) {
                _data[propName] = _.extend({}, propData, {
                    val: parsePropValue(propData).val,
                    options: parsePropOptions(propData).options
                });
            });
            return _data;
        };

        return this;
    });

    return dataParserService;
});
