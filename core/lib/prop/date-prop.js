var _ = require('lodash'),
    moment = require('moment'),

    Debuggable = require('../debuggable'),
    Prop = require('./prop');

/**
 *
 * @class DateProp
 * @extends Prop
 * @param {Object} queryModel
 * @param {Object} data
 * @param {String} data.key
 * @param {Date} data.val
 * @param {Object} [options]
 * @param {Object} [options.debugLevel]
 * @param {Object} [options.debugTag]
 * @returns {DateProp}
 * @constructor
 */
function DateProp(queryModel, data, options) {
    var _options = _.defaults(options, {
        debugTag : 'DateProp: ',
        debugLevel : Debuggable.PROD,
        defaultVal : null 
    });

    this.setDebugTag(_options.debugTag);
    this.setDebugLevel(_options.debugLevel);

    /**
     *
     * @override
     * @param val
     * @private
     */
    this._validate = function(val) {
        return true;
    };

    /**
     * @override
     * @returns {string}
     */
    this.getValue = function(){
        var value =  (this._data.val && this._data.val.toISOString) ? this._data.val : moment.utc(this._data.val);
        return value.toISOString();
    };

    this.setQueryModel(queryModel);
    this.setData(data);

    return this;
}
DateProp.prototype = Object.create(Prop.prototype);


module.exports = DateProp;
