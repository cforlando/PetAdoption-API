var util = require('util'),

    _ = require('lodash');


/**
 *
 * @name DebugLevel
 * @static
 * @readonly
 * @typedef {Object} DebugLevel
 * @property {Number} PROD
 * @property {Number} LOW
 * @property {Number} MED
 * @property {Number} HIGH
 * @property {Number} TMI
 * @property {Number} WAY_TMI
 * @enum {Number}
 */
var DEBUG = {

    PROD: 0,

    LOW: 1,

    MED: 2,

    HIGH: 3,

    TMI: 4,

    WAY_TMI: 5
};

/**
 * @extends DebugLevel
 * @class Debuggable
 * @property PROD
 * @property LOW
 * @property MED
 * @property HIGH
 * @property TMI
 * @property WAY_TMI
 * @param [options]
 * @param [options.debugLevel]
 * @param [options.debugTag]
 * @returns {Debuggable}
 * @constructor
 */
function Debuggable(options) {
    var _options = _.defaults(options, {
        debugLevel: DEBUG.PROD,
        debugTag: ''
    });

    this._debugLevel = _options.debugLevel;
    this._debugTag = _options.debugTag;

    /**
     * @function log
     * @memberOf Debuggable
     * @instance
     */

    /**
     * @function warn
     * @memberOf Debuggable
     * @instance
     */

    /**
     * @function error
     * @memberOf Debuggable
     * @instance
     */

    /**
     * @function trace
     * @memberOf Debuggable
     * @instance
     */

    /**
     *
     * @private
     */


    return this;
}

Debuggable.prototype = {

    log: function (level) {
        var input = this._parseInput(arguments);
        if (input.level <= this._debugLevel) {
            console.log.apply(console, input.args);
        }
    },

    warn: function (level) {
        var input = this._parseInput(arguments);
        if (input.level <= this._debugLevel) {
            console.warn.apply(console, input.args);
        }
    },

    error: function (level) {
        var input = this._parseInput(arguments);
        if (input.level <= this._debugLevel) {
            console.error.apply(console, input.args);
        }
    },

    trace: function (level) {
        var input = this._parseInput(arguments);
        if (input.level <= this._debugLevel) {
            console.trace.apply(console, input.args);
        }
    },

    _parseInput : function(args){
        var logArguments,
            level = args[0];
        if (!_.isNumber(level)) {
            logArguments = Array.prototype.slice.call(args, 0);
            level = -1
        } else {
            logArguments = Array.prototype.slice.call(args, 1) || [];
        }
        logArguments[0] = this._debugTag + logArguments[0];
        return {
            args: logArguments,
            level : level
        };
    },

    /**
     * Alias for util.inspect
     * @param {*} [data]
     * @returns {String}
     */
    dump: function (data) {
        return util.inspect((arguments.length > 0) ? data : this, {
            colors: true
        });
    },

    /**
     * @function format
     * @memberOf Debuggable
     * @param {String} formattedString
     * @param {...*} inputs
     * @returns {String}
     * @instance
     */
    format: util.format,


    /**
     *
     * @param {DebugLevel} level
     */
    setDebugLevel: function (level) {
        this._debugLevel = level;
    },


    /**
     *
     * @returns {DebugLevel}
     */
    getDebugLevel: function () {
        return this._debugLevel;
    },


    /**
     *
     * @param {String} tag will be prepended to any debug output
     */
    setDebugTag: function (tag) {
        this._debugTag = tag;
    },

    /**
     *
     * @returns {String}
     */
    getDebugTag: function () {
        return this._debugTag;
    }
};

_.extend(Debuggable, DEBUG);

module.exports = Debuggable;