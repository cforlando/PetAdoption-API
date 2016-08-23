define([
    'require',
    'underscore',
    'ngApp'
], function (require) {
    var ngApp = require('ngApp'),
        _ = require('underscore');

    return ngApp.service('dataParserService', function () {
        function parsePropValue(propData) {
            var _data = {};
            // console.log('parsing %o (key: %s - type; %s)', propData, propData.key, propData.valType);
            switch (propData.valType) {
                case 'Date':
                    // handle special case for date
                    _data.val = new Date(propData.val);
                    if (isNaN(_data.val.getTime())) {
                        _data.val = new Date();
                    }
                    break;
                case 'Boolean':
                    _data.val = (propData.val === false) ? false : propData.val || propData.defaultVal || propData.example;
                    break;
                case 'Location':
                case 'Number':
                    if (propData.val) {
                        if (/\./.test(propData.val.toString())) {
                            // value is float
                            // console.log('parsing float for %O', propData);
                            _data.val = parseFloat(propData.val);
                        } else {
                            // console.log('parsing int for %O', propData);
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
                    console.log('propData(%o).key = "%s" does not have any options', propData, propData.key);
                    propData.options = [];
                }
                return propData;
            }
            return {options: null}; // use empty object value
        }

        this.convertDataToSaveFormat = function (data) {
            console.log("convertDataToSaveFormat(%o)", data);
            var _data = {},
                _val;
            _.forEach(data, function (propData, propName, props) {
                if(!(propData.key)) return; // skip invalid properties
                _val = parsePropValue(propData).val;
                if(_.isUndefined(_val)) return;
                _data[propName] = _val;
            });
            return _data;
        };

        this.convertDataToModelFormat = function (data) {
            var _data = {};
            _.forEach(data, function (propData, propName, props) {
                if(!(propData.key)) return; // skip invalid properties
                _data[propName] = _.extend({}, propData, {
                    options: parsePropOptions(propData).options
                });
            });
            return _data;
        };

        this.convertToPetData = function (responseData) {
            var _data = {};
            _.forEach(responseData, function (propData, propName, props) {
                if(!(propData.key)) return console.log('skipping %s (%o)', propName, propData); // skip invalid properties
                _data[propName] = _.extend({}, propData, {
                    val: parsePropValue(propData).val,
                    options: parsePropOptions(propData).options
                });
            });
            return _data;
        };

        this.formatRenderData = function (model) {

            function parseModel(model) {
                var parsedData = {},
                    locationRegexResult,
                    locationFieldNames = [];

                _.forEach(model, function (propData, propName) {
                    locationRegexResult = /(.*)(Lat|Lon)$/.exec(propName);
                    if (locationRegexResult && locationRegexResult[2]) {
                        var baseFieldName = locationRegexResult[1],
                            baseFieldTypeName = locationRegexResult[2];
                        locationFieldNames.push(baseFieldName);
                        parsedData[baseFieldName] = parsedData[baseFieldName] || {
                            valType: 'Location',
                            fieldLabel: baseFieldName
                        };
                        parsedData[baseFieldName][baseFieldTypeName] = propData;
                    } else {
                        parsedData[propName] = propData;
                    }
                });

                return parsedData;
            }

            function sortRenderDataArray(props) {
                return _.sortBy(props, function (propData) {
                    if (propData.key == 'petId') return 0;
                    if (propData.key == 'images') return 1;
                    if (propData.key == 'petName') return 2;
                    return (props.length - 1);
                })
            }

            var renderData = parseModel(model),
                renderDataArray = Object.keys(renderData).map(function (propName) {
                    return renderData[propName];
                }),
                sortedRenderDataArray = sortRenderDataArray(renderDataArray);

            console.log('renderData: %o', sortedRenderDataArray);
            return sortedRenderDataArray;
        }

        return this;
    });

})
