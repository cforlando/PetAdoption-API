var _ = require('lodash'),

    Debuggable = require('../debuggable'),
    Prop = require('./prop');

/**
 *
 * @class BooleanProp
 * @extends Prop
 * @param {Object} queryModel
 * @param {Object} data
 * @param {String} data.key
 * @param {Boolean|String} data.val
 * @param {Object} [options]
 * @param {Object} [options.debugLevel]
 * @param {Object} [options.debugTag]
 * @returns {BooleanProp}
 * @constructor
 */
function BooleanProp(queryModel, data, options) {
    var _options = _.defaults(options, {
        debugTag : 'BooleanProp: ',
        debugLevel : Debuggable.PROD
    });

    this.setDebugTag(_options.debugTag);
    this.setDebugLevel(_options.debugLevel);

    this._validate = function() {
        return (_.isBoolean(this.getValue()))
    };

    this.setQueryModel(queryModel);
    if(_.isString(data.val)){
        this.log(Debuggable.MED, 'formatting string');
        this.setData(_.defaults({
            val : /^\s*(y|yes)\s*$/i.test(data.val)
        }, data));
    } else {
        this.setData(data);
    }

    return this;
}
BooleanProp.prototype = Object.create(Prop.prototype);


module.exports = BooleanProp;
