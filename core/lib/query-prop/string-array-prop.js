var _ = require('lodash'),

    Debuggable = require('../debuggable'),
    Prop = require('./prop');

/**
 * @class StringArrayProp
 * @extends Prop
 * @param {Object} queryModel
 * @param {Object} data
 * @param {String} data.key
 * @param {String[]} data.val
 * @param {Object} [options]
 * @param {Object} [options.debugLevel]
 * @param {Object} [options.debugTag]
 * @returns {StringArrayProp}
 * @constructor
 */
function StringArrayProp(queryModel, data, options) {
    var _options = _.defaults(options, {
        debugTag : 'StringArrayProp: ',
        debugLevel : Debuggable.PROD,
        defaultVal : null 
    });

    this.setDebugTag(_options.debugTag);
    this.setDebugLevel(_options.debugLevel);


    this._validate = function() {
        // TODO string array prop
        return false
    };

    this.setQueryModel(queryModel);
    this.setData(data);
    return this;
}
StringArrayProp.prototype = Object.create(Prop.prototype);

module.exports = StringArrayProp;
