var util = require('util'),
    path = require('path'),
    fs = require('fs'),
    Events = require('events'),

    mongoose = require('mongoose'),
    _ = require('lodash'),

    Debuggable = require('../../../lib/debuggable');

// prevent mongoose promise warning
mongoose.Promise = require('q').Promise;

/**
 *
 * @extends Debuggable
 * @class MongoDBAdapter
 * @param [options]
 * @param {Number} [options.retryTimeout] in milliseconds
 * @param {String} [options.debugTag]
 * @param {DebugLevel} [options.debugLevel]
 * @param [options.context]
 * @param {Function} [options.onSuccess]
 * @param {Function} [options.onFailure]
 * @param {Function} [options.onFatal]
 * @returns {MongoDBAdapter}
 * @constructor
 */
function MongoDBAdapter(options) {
    var _options = _.defaults(options, {
        retryTimeout: 2000,
        debugTag: 'MongoDBAdapter: ',
        debugLevel: Debuggable.PROD,
        context: null,
        onFailure: function () {
            console.error.apply(console, arguments);
        }
    });

    this.setDebugTag(_options.debugTag);
    this.setDebugLevel(_options.debugLevel);

    var localConfig = (function () {
        var self = this;
        var config = {
            username: 'username',
            password: 'password',
            domain: 'example.com',
            port: 'port',
            database: 'no_database_provided'
        };
        try {
            //override template config with local json file data
            config = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'mongodb.config')));
        } catch (e) {
            self.error(e);
        }
        return config;
    })();

    this._identity = {
        username: process.env.username || localConfig.username,
        password: process.env.password || localConfig.password,
        domain: process.env.domain || localConfig.domain,
        port: process.env.port || localConfig.port,
        database: process.env.database || localConfig.database
    };


    this._context = _options.context;

    this._config = {
        retryTimeout: _options.retryTimeout
    };

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
            mongodbCred = util.format('%s%s', this._identity.username ? this._identity.username : '', this._identity.password ? ':' + this._identity.password : ''),
            mongodbURL = util.format("mongodb://%s%s:%s/%s", mongodbCred ? mongodbCred + '@' : '', this._identity.domain, this._identity.port, this._identity.database),
            _options = options || {},
            context = _options.context || this._context,

            // use local var declaration to keep scope of callbacks to this call only. ie. don't overwrite initial values
            callbacks = _.reduce(this._callbacks, function (callbacks, callbackFunc, callbackName) {
                callbacks[callbackName] = _options[callbackName] || callbackFunc;
                return callbacks;
            }, {});

        if (callbacks.beforeConnect) callbacks.beforeConnect.call(context);

        this.log(Debuggable.LOW, 'mongoose is connecting to %s', mongodbURL);

        this.mongoose = mongoose.createConnection(mongodbURL);

        this.mongoose.on('disconnected', function () {
            self.emit('disconnected');
        });

        this.mongoose.on('error', function (err) {
            self.emit('error', err);
            if (callbacks.onFailure) callbacks.onFailure.call(context);
        });

        this.mongoose.once('open', function () {
            self.log(Debuggable.LOW, 'mongoose is connected');
            self.emit('connected');
            if (callbacks.onSuccess) callbacks.onSuccess.call(context)
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
        if (!(this.isClosed() || this.isDisconnecting())) {
            this.mongoose.close(callback);
        } else {
            callback();
        }
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
        return this.mongoose.readyState === 0;
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

