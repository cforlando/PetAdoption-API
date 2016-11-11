var _ = require('lodash'),

    Debuggable = require('../debuggable'),
    Prop = require('./prop');

/**
 *
 * @class PetIDProp
 * @extends Prop
 * @param {Object} queryModel
 * @param {Object} data
 * @param {String} data.key
 * @param {String} data.val
 * @param {Object} [options]
 * @param {Object} [options.debugLevel]
 * @param {Object} [options.debugTag]
 * @returns {PetIDProp}
 * @constructor
 */
function PetIDProp(queryModel, data, options) {
    var _options = _.defaults(options, {
        debugTag : 'PetIDProp: ',
        debugLevel : Debuggable.PROD
    });

    this.setDebugTag(_options.debugTag);
    this.setDebugLevel(_options.debugLevel);

    this._isValidId = function(petId) {
        return /^[0-9a-fA-F]{24}$/.test(petId)
    };

    this._validate = function() {
        return (this._isValidId(this.getValue()))
    };

    this.getValue = function(){
        return '' + this._data.val;
    };

    this.setQueryModel(queryModel);
    this.setData(data);
    return this;
}

PetIDProp.prototype = Object.create(Prop.prototype);

module.exports = PetIDProp;
