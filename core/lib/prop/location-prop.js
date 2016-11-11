var _ = require('lodash'),

    Debuggable = require('../debuggable'),
    Prop = require('./prop');

/**
 * @class LocationProp
 * @extends Prop
 * @param {Object} queryModel
 * @param {Object} data
 * @param {String} data.key
 * @param {Number|*} data.val
 * @param {Object} [options]
 * @param {Object} [options.debugLevel]
 * @param {Object} [options.debugTag]
 * @returns {LocationProp}
 * @constructor
 */
function LocationProp(queryModel, data, options) {
    var _options = _.defaults(options, {
        debugTag : 'LocationProp: ',
        debugLevel : Debuggable.PROD
    });

    this.setDebugTag(_options.debugTag);
    this.setDebugLevel(_options.debugLevel);


    this._validate = function() {
        // TODO implement location prop
        return false
    };

    this.setQueryModel(queryModel);
    this.setData(data);
    return this;
}
LocationProp.prototype = Object.create(Prop.prototype);

module.exports = LocationProp;
