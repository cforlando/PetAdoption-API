var _ = require('lodash'),

    Debuggable = require('../debuggable'),
    Prop = require('./prop');

/**
 *
 * @class IntegerProp
 * @extends Prop
 * @param {Object} queryModel
 * @param {Object} data
 * @param {String} data.key
 * @param {Number} data.val
 * @param {Object} [options]
 * @param {Object} [options.debugLevel]
 * @param {Object} [options.debugTag]
 * @returns {IntegerProp}
 * @constructor
 */
function IntegerProp(queryModel, data, options) {
    var _options = _.defaults(options, {
        debugTag : 'IntegerProp: ',
        debugLevel : Debuggable.PROD
    });

    this.setDebugTag(_options.debugTag);
    this.setDebugLevel(_options.debugLevel);

    this._validate = function(petId) {
        return _.isFinite(this.getValue());
    };

    this.setQueryModel(queryModel);
    this.setData(data);
    return this;
}

IntegerProp.prototype = Object.create(Prop.prototype);

module.exports = IntegerProp;
