var util = require('util'),
    path = require('path'),
    fs = require('fs'),
    Events = require('events'),

    mongoose = require('mongoose'),
    _ = require('lodash'),

    config = require('../../../config'),
    Debuggable = require('../../../lib/debuggable');

// prevent mongoose promise warning
mongoose.Promise = require('q').Promise;

/**
 *
 * @extends Debuggable
 * @class MongoDBAdapter
 * @param [options]
 * @param {String} [options.debugTag]
 * @param {DebugLevel} [options.debugLevel]
 * @param [options.mongoConnectionURL]
 * @param [options.context]
 * @param {Function} [options.onSuccess]
 * @param {Function} [options.onFailure]
 * @param {Function} [options.onFatal]
 * @returns {MongoDBAdapter}
 * @constructor
 */
function MongoDBAdapter(options) {
    var _options = _.defaults(options, {
        debugTag: 'MongoDBAdapter: ',
        debugLevel: Debuggable.PROD,
        mongoConnectionURI: config.MONGODB_URI,
        context: null,
        onFailure: function () {
            console.error.apply(console, arguments);
        }
    });

    this.setDebugTag(_options.debugTag);
    this.setDebugLevel(_options.debugLevel);

    this._config = _options;

    this._callbacks = {
        beforeConnect: _options.beforeConnect,
        onSuccess: _options.onSuccess,
        onFailure: _options.onFailure,
        onFatal: _options.onFatal
    };

    this.mongoose = false;

    return this;
}

MongoDBAdapter.prototype = {

    /**
     *
     * @param [options]
     * @param [options.beforeConnect]
     * @param [options.onSuccess]
     * @param [options.onFailure]
     * @param [options.onFatal]
     * @param [options.context]
     */
    connect: function (options) {
        var self = this,
            _options = _.defaults(options, {
                mongoConnectionURI: this._config.mongoConnectionURI,
                context: this._config.context
            }),
            mongoConnectionURI = _options.mongoConnectionURI,
            context = _options.context,

            // use local var declaration to keep scope of callbacks to this call only. ie. don't overwrite initial values
            callbacks = _.reduce(this._callbacks, function (callbacks, callbackFunc, callbackName) {
                callbacks[callbackName] = _options[callbackName] || callbackFunc;
                return callbacks;
            }, {});

        if (callbacks.beforeConnect) callbacks.beforeConnect.call(context);

        this.log(Debuggable.LOW, 'mongoose is connecting to %s', mongoConnectionURI);

        if (!this.isConnecting()) this.mongoose = mongoose.createConnection(mongoConnectionURI);

        this.mongoose.on('close', function () {
            self.emit('close');
        });

        this.mongoose.on('connecting', function () {
            self.emit('connecting');
        });

        this.mongoose.on('disconnecting', function () {
            self.emit('disconnecting');
        });

        this.mongoose.on('error', function (err) {
            self.emit('error', err);
            if (callbacks.onFailure) callbacks.onFailure.call(context);
        });


        this.mongoose.on('connected', function () {
            self.log(Debuggable.LOW, 'mongoose is connected');
            self.emit('connected');
            if (callbacks.onSuccess) callbacks.onSuccess.call(context);
            // delete callbacks.onSuccess;
        });

        this.on('error', function (err) {
            // catch error events so node.js doesn't throw an error itself
            this.error('err: %s', err);
        })
    },

    /**
     *
     * @param callback
     */
    close: function (callback) {
        this.mongoose.close(callback);
    },

    /**
     *
     * @returns {boolean}
     */
    isConnecting: function () {
        return this.mongoose.readyState === 2;
    },

    /**
     *
     * @returns {boolean}
     */
    isConnected: function () {
        return this.mongoose.readyState === 1;
    },

    /**
     *
     * @returns {boolean}
     */
    isDisconnecting: function () {
        return this.mongoose.readyState === 3;
    },

    /**
     *
     * @returns {boolean}
     */
    isClosed: function () {
        return !this.mongoose || this.mongoose.readyState === 0;
    },

    /**
     *
     * @returns {Connection|false}
     */
    getMongoose: function () {
        return this.mongoose;
    }

};

_.extend(MongoDBAdapter.prototype, Events.prototype, Debuggable.prototype);

module.exports = MongoDBAdapter;

