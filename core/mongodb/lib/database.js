var util = require('util'),

    _ = require('lodash'),
    moment = require('moment'),

    Cache = require('../../lib/cache/index'),

    MongoDbAdapter = require('./adapter/index'),
    DbError = require('./error/index');

/**
 * @class BaseDatabase
 * @param {Collection} collection
 * @param {Object} [options]
 * @param {MongoDbAdapter} [options.adapter]
 * @param {String} [options.collectionNamePrefix]
 * @class BaseDatabase
 * @constructor
 */
function BaseDatabase(collection, options) {
    var _options = _.defaults(options, {collectionNamePrefix: 'prod_'});

    /**
     * @var {Collection} collection
     * @memberOf BaseDatabase
     */
    this.collection = collection;
    this._config = this._config || {};
    this._queue = this._queue || [];
    this._cache = this._cache || new Cache();

    this.setAdapter(_options.adapter || new MongoDbAdapter({context: this}));
}

BaseDatabase.prototype = {

    _addToQueue: function (entry, context) {
        if (_.isFunction(entry)) {
            this._queue.push({
                callback: entry,
                context: context || this
            });
        }
    },

    _processQueue: function () {
        while (this._queue.length > 0) {
            this._queue[0].callback.call(this._queue[0].context, this.getAdapter());
            this._queue.shift();
        }
    },


    initDatabase: function () {
        this.MongooseModel = this.collection.toMongooseModel(this.getAdapter());
        this.getAdapter().on('connected', this._processQueue.bind(this))
    },

    /**
     *
     * Adds function to the queue
     * @param {Function} [func]
     * @param [options]
     * @param [options.context]
     */
    exec: function (func, options) {
        var _options = _.defaults(options, {});

        this._addToQueue(func, _options.context);

        if (this._adapter.isConnected()) {
            this._processQueue();
        } else if (this._adapter.isClosed() || this._adapter.isDisconnecting()) {
            this._adapter.connect();
        }
    },


    /**
     *
     * @param {String} name
     * @param {Object} data
     * @param {Object} options
     * @param {Function} options.done
     * @param {String|String[]} options.type
     * @param {String} options.dir
     *
     */
    cacheData: function (name, data, options) {
        var self = this;
        var _options = _.defaults(options, {
            type: ['json']
        });
        var cacheParams = {
            name: name,
            dir: _options.dir,
            done: _options.done
        };

        if (!_.isArray(_options.type)) {
            return this._cache.save(_options.type, data, cacheParams);
        }

        return Promise.all(_options.type.map(function (cacheType) {
                return self._cache.save(cacheType, data, cacheParams)
            }))
            .catch(function (err) {
                console.error(err);
                return Promise.resolve();
            })

    },

    /**
     * Stops execution of the queue and disconnects
     * @returns {Promise}
     */
    stop: function () {
        var self = this;
        var adapter = self.getAdapter();

        if (adapter.isClosed()) {
            return Promise.resolve();
        }

        return new Promise(function (resolve) {
            adapter.once('close', function () {
                resolve();
            });

            adapter.close();
        })

    },

    /**
     *
     * @param {MongoDbAdapter} adapter
     */
    setAdapter: function (adapter) {
        this._adapter = adapter;
    },

    /**
     *
     * @returns {MongoDbAdapter}
     */
    getAdapter: function () {
        return this._adapter;
    },


    setConfig: function (propName, propValue) {
        this._config[propName] = propValue;
    },

    getConfig: function (propName) {
        return this._config[propName];
    },

    /**
     *
     * @param {Object} props
     * @param [options]
     * @returns {Promise.<Object>}
     */
    findOne: function (props, options) {
        var self = this;
        var _options = _.defaults(options, self._config.queryOptions);

        return new Promise(function (resolve, reject) {

            self.exec(function () {
                self.MongooseModel
                    .findOne(props)
                    .lean()
                    .exec(function (err, queriedDoc) {
                        if (err || !queriedDoc) {
                            err = new DbError(err || 'No results returned');
                            console.error(err);
                            reject(err);
                            return;
                        }

                        resolve(queriedDoc ? queriedDoc : {})
                    });

            })
        })
    },


    /**
     * @param {Object} whereProps
     * @param {Object} saveProps
     * @param [options]
     * @returns {Promise.<Object>}
     */
    update: function (whereProps, saveProps, options) {
        var self = this;
        var _options = _.defaults(options, {
            new: true,
            upsert: true
        }, self._config.queryOptions);

        return new Promise(function (resolve, reject) {

            self.exec(function () {
                var doc = new self.MongooseModel(saveProps),
                    data = doc.toObject();

                delete data._id;
                delete data.__v;

                self.MongooseModel.findOneAndUpdate(whereProps, data, options)
                    .lean()
                    .exec(function (err, savedDoc) {
                        if (err) {
                            err = new DbError(err);
                            console.error(err);
                            reject(err);
                            return;
                        }

                        resolve(savedDoc ? savedDoc : {})
                    })
            });
        })
    },

    /**
     * @param {Object} saveProps
     * @param [options]
     * @returns {Promise.<Object>}
     */
    create: function (saveProps, options) {
        var self = this;
        var _options = _.defaults(options, self._config.queryOptions);

        return new Promise(function (resolve, reject) {
            self.exec(function () {
                var doc = new self.MongooseModel(saveProps);

                doc.save(function (err, savedDoc) {
                    if (err) {
                        err = new DbError(err);
                        console.error(err);
                        reject(err);
                        return;
                    }

                    resolve(savedDoc.toObject ? savedDoc.toObject() : savedDoc)
                });
            });
        })
    }

};

module.exports = BaseDatabase;
