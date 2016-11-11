define([
    'require',
    'underscore',
    'async',
    'ngApp'
], function (require) {
    var ngApp = require('ngApp'),
        async = require('async'),
        _ = require('underscore');

    return ngApp.service('dataParser', function () {
        var self = this;

        this.getURLsFrom$inputs = function ($inputs, callback) {
            var _previewPhotos = [];

            async.each($inputs,
                function each(inputEl, done) {
                    var numOfFiles = inputEl.files.length;

                    if (numOfFiles > 0) {
                        var reader = new FileReader(),
                            readIndex = 0,
                            isLoadComplete = function () {
                                return readIndex === numOfFiles
                            };

                        reader.onload = function (e) {
                            readIndex++;
                            console.log('file input - reader.onload(%o) - %d/%d', arguments, readIndex, numOfFiles);
                            _previewPhotos.push(e.target.result);
                            if (isLoadComplete()) {
                                console.log('file input - load complete', arguments, readIndex, numOfFiles);
                                done();
                            } else {
                                reader.readAsDataURL(inputEl.files[readIndex]);
                            }
                        };

                        reader.readAsDataURL(inputEl.files[readIndex]);
                    } else {
                        done();
                    }
                },
                function complete() {
                    callback(null, _previewPhotos);
                });
        };

        this.getFormattedPropValue = function (propData) {
            // console.log('parsing %o (key: %s - type; %s)', propData, propData.key, propData.valType);
            switch (propData.valType) {
                case 'Date':
                    // handle special case for date
                    var dateVal = new Date(propData.val);
                    if (isNaN(dateVal.getTime())) {
                        return new Date();
                    }
                    return dateVal;
                case 'Boolean':
                    return (propData.val === false) ? false : propData.val;
                case 'Location':
                case 'Number':
                    if (propData.val) {
                        if (/\./.test(propData.val.toString())) {
                            // value is float
                            // console.log('parsing float for %O', propData);
                            return parseFloat(propData.val);
                        } else {
                            // console.log('parsing int for %O', propData);
                            // value is integer
                            return parseInt(propData.val || -1);
                        }
                    }
                    break;
                default:
                    return propData.val;
            }
        };

        this.getFormattedPropOptions = function (propData) {
            if (propData) {
                if (propData.options) {
                    return _.uniq(propData.options);
                } else {
                    console.log('propData(%o).key = "%s" does not have any options', propData, propData.key);
                    return []
                }
            }
            return null; // use empty object value
        };

        this.convertDataToSaveFormat = function (data) {
            console.log("convertDataToSaveFormat(%o)", data);
            var saveData = {},
                propValue;
            _.forEach(data, function (propData) {
                if (!(propData.key)) return; // skip invalid properties
                propValue = self.getFormattedPropValue(propData);
                if (_.isUndefined(propValue)) return;
                saveData[propData.key] = propValue;
            });
            return saveData;
        };

        this.convertDataToSpeciesFormat = function (data) {
            var _data = [];
            _.forEach(data, function (propData) {
                if (!(propData.key)) return; // skip invalid properties
                var newProp = _.defaults({
                    options: self.getFormattedPropOptions(propData)
                }, propData);
                delete newProp.val; // remove saved values
                _data.push(newProp);

            });
            return _data;
        };

        this.convertToPetData = function (responseData) {
            var _data = {};
            _.forEach(responseData, function (propData) {
                if (!(propData.key)) return console.log('skipping %s (%o)', propData.key, propData); // skip invalid properties
                _data[propData.key] = _.defaults({
                    val: self.getFormattedPropValue(propData),
                    options: self.getFormattedPropOptions(propData)
                }, propData);
            });
            return _data;
        };

        this.formatModel = function (model) {
            var formattedModelData = [],
                locationRegexResult,
                locationProps = {};

            _.forEach(model, function (propData) {
                if (!(propData.key)) return console.log('skipping formatting of %s (%o)', propData.key, propData); // skip invalid properties
                locationRegexResult = /(.*)(Lat|Lon)$/.exec(propData.key);
                if (locationRegexResult && locationRegexResult[2]) {
                    var baseFieldName = locationRegexResult[1],
                        baseFieldTypeName = locationRegexResult[2];
                    locationProps[baseFieldName] = locationProps[baseFieldName] || {
                            valType: 'Location',
                            fieldLabel: baseFieldName
                        };
                    locationProps[baseFieldName][baseFieldTypeName] = propData;
                    if (locationProps[baseFieldName].Lat && locationProps[baseFieldName].Lon) {
                        // location prop fully parsed, so we push
                        formattedModelData.push(locationProps[baseFieldName]);
                        delete locationProps[baseFieldName];
                    }
                } else {
                    formattedModelData.push(propData);
                }
            });

            return formattedModelData;
        };

        this._sortProps = function (props) {
            return _.sortBy(props, function (propData) {
                if (propData.key == 'petId') return 0;
                if (propData.key == 'images') return 1;
                if (propData.key == 'petName') return 2;
                if (propData.key == 'species') return 3;
                return (props.length - 1);
            })
        };

        this.buildRenderData = function (model) {

            var renderData = this.formatModel(model),
                sortedRenderDataArray = this._sortProps(renderData);

            console.log('renderData: %o', sortedRenderDataArray);
            return sortedRenderDataArray;
        };

        return this;
    });

});
