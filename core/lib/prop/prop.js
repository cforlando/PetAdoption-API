var _ = require('lodash'),

    Debuggable = require('../debuggable');


/**
 *
 * @extends Debuggable
 * @class Prop
 * @param {Object} queryModel
 * @param {Object} data
 * @param {String} data.key
 * @param {*} data.val
 * @param {Object} [options]
 * @param {Object} [options.debugLevel]
 * @param {Object} [options.debugTag]
 * @returns {Prop}
 * @constructor
 */
function Prop(queryModel, data, options) {
    var _options = _.defaults(options, {
        debugTag: 'Prop: ',
        debugLevel: Debuggable.PROD,
        defaultVal: null
    });

    this.setDebugTag(_options.debugTag);
    this.setDebugLevel(_options.debugLevel);

    this.setQueryModel(queryModel);
    this.setData(data);

    /**
     * @var {Object} _data
     * @type Object
     * @private
     */

    return this;
}

Prop.prototype = {

    /**
     * This can be overwritten in child instances
     * @returns {boolean}
     * @private
     */
    _validate: function () {
        return (this.speciesData && this._data.val != undefined && this._data.key != undefined);
    },

    /**
     *
     * @param {Object} queryModel
     */
    setQueryModel: function (queryModel) {
        this.speciesData = queryModel;
    },


    /**
     * sets the prop data
     * @param {Object} data
     */
    setData: function (data) {
        this._data = this._data || {};

        if (!data) return this.error('setting undefined data: %s', this.dump()); // quit
        if (!data.key) this.trace('setting data without key: %s', this.dump(data));

        var self = this,
            queryModelPropData = _.defaults(data, this.getPropField(data.key));
        this.log(Debuggable.LOW, "assigning '%s' with data: %s", data.key, this.dump(queryModelPropData));
        _.forEach(queryModelPropData, function (queryModelFieldValue, queryModelFieldName) {
            self._data[queryModelFieldName] = queryModelFieldValue;
        });
    },

    /**
     *
     * @param {String} propFieldName
     * @param {*} propFieldValue
     */
    setPropField: function (propFieldName, propFieldValue) {
        this._data[propFieldName] = propFieldValue;
    },

    /**
     *
     * @param {String} propFieldName
     * @returns {*}
     */
    getPropField: function (propFieldName) {
        return _.find(this.speciesData, {key: propFieldName});
    },

    /**
     *
     * @returns {*}
     */
    getValue: function () {
        return this._data.val;
    },

    /**
     *
     * @returns {String}
     */
    getName: function () {
        return this._data.key;
    },

    /**
     *
     * @returns {String}
     */
    getType: function () {
        return this._data.valType;
    },

    /**
     *  @returns {Boolean}
     */
    isValid: function () {
        return this._validate();
    },


    /**
     * Return prop data in V1 Format
     * @returns {Object}
     */
    getV1Format: function () {
        var self = this;
        if (!this.speciesData) throw new Error("Unable able to generate v1 format for '" + this.getName() + "' without specified speciesData");
        return _.reduce(this.getPropField(this.getName()), function (prop, propFieldValue, propFieldName) {
            prop[propFieldName] = (self._data[propFieldName]) ? self._data[propFieldName] : propFieldValue;
            return prop;
        }, {val: self.getValue()});
    },

    /**
     * Return prop data in V2 Format
     * @returns {Object}
     */
    getV2Format: function () {
        return this.getValue();
    },

    getRegex: function () {
        return this.getValue() ? this.escapeRegExp(this.getValue().toString()) : '.*'
    },

    /**
     *
     * @param {String} str
     * @returns {String}
     */
    escapeRegExp: function (str) {
        this.log(Debuggable.TMI, 'escaping regex: %s', this.dump(str));
        return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
    }
};

_.extend(Prop.prototype, Debuggable.prototype);

module.exports = Prop;
