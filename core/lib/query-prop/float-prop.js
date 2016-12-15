var _ = require('lodash'),

    Debuggable = require('../debuggable'),
    Prop = require('./prop');

/**
 *
 * @class FloatProp
 * @extends Prop
 * @param {Object} queryModel
 * @param {Object} data
 * @param {String} data.key
 * @param {Number} data.val
 * @param {Object} [options]
 * @param {Object} [options.defaultVal=null]
 * @param {Object} [options.debugLevel]
 * @param {Object} [options.debugTag]
 * @returns {FloatProp}
 * @constructor
 */
function FloatProp(queryModel, data, options) {
    var _options = _.defaults(options, {
        debugTag : 'FloatProp: ',
        debugLevel : Debuggable.PROD,
        defaultVal : null 
    });

    this.setDebugTag(_options.debugTag);
    this.setDebugLevel(_options.debugLevel);

    this._validate = function(){
        return (_.isNumber(this.getValue()))
    };

    this.setQueryModel(queryModel);
    this.setData(data);
    return this;
}

FloatProp.prototype=  Object.create(Prop.prototype);

module.exports = FloatProp;
