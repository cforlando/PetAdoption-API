var util = require('util');
var path = require('path');
var Events = require('events');

var log = require('debug')('pet-api:adapter');
var mongoose = require('mongoose');
var _ = require('lodash');

var config = require('../../../config');

// prevent mongoose promise warning
mongoose.Promise = require('q').Promise;

/**
 *
 * @class MongoDbAdapter
 * @param [options]
 * @param [options.mongoConnectionURL]
 * @param [options.context]
 * @param {Function} [options.onSuccess]
 * @param {Function} [options.onFailure]
 * @returns {MongoDbAdapter}
 * @constructor
 */
function MongoDbAdapter(options) {
    var opts = _.defaults(options, {
        mongoConnectionURI: config.MONGODB_URI,
        context: null,
        onFailure: function () {
            console.error.apply(console, arguments);
        }
    });

    this.log = log;

    this._config = opts;

    this._callbacks = {
        beforeConnect: opts.beforeConnect,
        onSuccess: opts.onSuccess,
        onFailure: opts.onFailure
    };

    this._mongoose = mongoose.createConnection(opts.mongoConnectionURI);

    this.connect();
    return this;
}

MongoDbAdapter.prototype = {

    /**
     *
     * @param [options]
     * @param [options.beforeConnect]
     * @param [options.onSuccess]
     * @param [options.onFailure]
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

            // use local var declaration to keep scope of callbacks to this call only.
            // ie. don't overwrite initial values
            callbacks = _.reduce(this._callbacks, function (callbacks, callbackFunc, callbackName) {
                callbacks[callbackName] = _options[callbackName] || callbackFunc;
                return callbacks;
            }, {});

        if (callbacks.beforeConnect) callbacks.beforeConnect.call(context);

        this.log('mongoose is connecting to %s', mongoConnectionURI);

        this._mongoose.on('error', function (err) {
            self.emit('error', err);
            if (callbacks.onFailure) callbacks.onFailure.call(context);
        });

        this.on('error', function (err) {
            // catch error events so node.js doesn't throw an error itself
            console.error('core.mongodb.lib.adapter: %s', err);
        });

        this._mongoose.on('connecting', function () {
            self.onConnecting.apply(self, arguments)
        });

        this._mongoose.on('disconnecting', function () {
            self.emit('disconnecting');
        });

        this._mongoose.on('close', function () {
            self.emit('close');
        });

        this._mongoose.on('connected', function () {
            self.onConnected.call(self, callbacks.onSuccess, context)
        });

        if (!(this.isConnected() || this.isConnecting())) {
            this._mongoose.open(_options.mongoConnectionURI)
        }
    },
    onConnecting: function (callback, context) {
        this.log('mongoose is connecting');
        this.emit('connecting');
        if (callback) callback.call(context);
        // delete callbacks.onSuccess;
    },

    onConnected: function (callback, context) {
        this.log('mongoose is connected');
        this.emit('connected');
        if (callback) callback.call(context);
        // delete callbacks.onSuccess;
    },

    /**
     *
     * @param callback
     */
    close: function (callback) {
        var self = this;
        return new Promise(function (resolve, reject) {
            if (!self._mongoose) return resolve();
            self._mongoose.close(function () {
                if (callback) callback();
                resolve();
            });
        })
    },

    /**
     *
     * @returns {boolean}
     */
    isConnecting: function () {
        return this._mongoose.readyState === 2;
    },

    /**
     *
     * @returns {boolean}
     */
    isConnected: function () {
        return this._mongoose.readyState === 1;
    },

    /**
     *
     * @returns {boolean}
     */
    isDisconnecting: function () {
        return this._mongoose.readyState === 2;
    },

    /**
     *
     * @returns {boolean}
     */
    isClosed: function () {
        return !this._mongoose || this._mongoose.readyState === 0;
    },

    /**
     *
     * @returns {Connection|false}
     */
    getMongoose: function () {
        return this._mongoose;
    }

};

MongoDbAdapter.prototype = Object.assign({}, Events.prototype, MongoDbAdapter.prototype);

module.exports = MongoDbAdapter;

