var util = require('util'),
    path = require('path'),

    _ = require('lodash'),
    moment = require('moment'),

    Cache = require('../../../lib/cache/index'),
    MongoDBAdapter = require('../adapter'),
    Debuggable = require('../../../lib/debuggable/index'),
    DBError = require('../error');

/**
 * @extends Debuggable
 * @class Database
 * @param {ModelFactory} modelFactory
 * @param {Object} [options]
 * @param {MongoDBAdapter} [options.adapter]
 * @param {String} [options.modelNamePrefix]
 * @param {DebugLevel} [options.debugLevel]
 * @param {String} [options.debugTag]
 * @class Database
 * @constructor
 */
function Database(modelFactory, options) {
    /**
     * @var {ModelFactory} modelFactory
     * @memberOf Database
     */
    this._super.call(this, modelFactory, options);

    this.exec(function () {
        this.log(Debuggable.LOW, 'initializing db model');
        this.MongooseModel = this.modelFactory.generateMongooseModel(this.getAdapter());
    }, {context: this});
    return this;
}

Database.prototype = {
    _super: function (modelFactory, options) {
        var _options = _.defaults(options, {
            modelNamePrefix: 'prod_',
            debugLevel: Debuggable.PROD,
            debugTag: 'DB: '
        });

        this.setDebugLevel(_options.debugLevel);
        this.setDebugTag(_options.debugTag);
        this.modelFactory = modelFactory;
        this._config = this._config || {};
        this._queue = this._queue || [];
        this._cache = this._cache || new Cache();
        this.setAdapter(_options.adapter || new MongoDBAdapter({context: this}));
        this._setupListeners(this.getAdapter());
    },

    /**
     *
     * @param {MongoDBAdapter} [mongoAdapter]
     * @private
     */
    _setupListeners: function (mongoAdapter) {
        var self = this,
            adapter = mongoAdapter || this.getAdapter();

        adapter.on('connected', function () {
            self._processQueue();
        });
    },

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
     */
    cacheData: function (name, data, options) {
        var self = this,
            _options = _.defaults(options, {
                type: ['json']
            }),
            cacheParams = {
                name: name,
                dir: _options.dir,
                done: _options.done
            };

        if (_.isArray(_options.type)) {
            _.forEach(_options.type, function (cacheType) {
                self._cache.save(cacheType, data, cacheParams)
            })
        } else {
            this._cache.save(_options.type, data, cacheParams);
        }
    },

    /**
     * Stops execution of the queue and disconnects
     * @param callback
     */
    stop: function (callback) {
        this.getAdapter().once('close', function () {
            callback();
        });
        this.getAdapter().close();
    },

    /**
     *
     * @param {MongoDBAdapter} adapter
     */
    setAdapter: function (adapter) {
        this._adapter = adapter;
    },

    /**
     *
     * @returns {MongoDBAdapter}
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
     * @param [options.context]
     */
    findOne: function (props, options) {
        var self = this,
            _options = _.defaults(options, self._config.queryOptions);

        this.exec(function () {
            self.log(Debuggable.MED, 'mongodb.findDB() - searching for: %s', self.dump(props));
            self.MongooseModel
                .findOne(props)
                .lean()
                .exec(function (err, queriedDoc) {
                    if (err || !queriedDoc) err = new DBError(err || 'No results returned');
                    self.log(Debuggable.MED, 'mongodb.findDB() - result: %s', self.dump(arguments));
                    if (_options.complete) _options.complete.apply(_options.context, [err, queriedDoc ? queriedDoc : {}]);
                });

        })
    },
    /**
     * @callback QueryCallback
     * @param {DBError} err
     * @param {Object} result
     */

    /**
     *
     * @param {Object} options
     * @param {QueryCallback} options.complete callback on operation completion
     * @param {Object} [options.context] context for complete function callback
     */
    findLatest: function (options) {
        var self = this,
            _options = _.defaults(options, self._config.queryOptions);

        this.exec(function () {
            self.MongooseModel.getLatest(function (err, doc) {
                if (err || !doc) {
                    err = new DBError(err || "No docs found");
                    self.error(err);
                    if (_options.complete) _options.complete(err);
                } else {
                    var cacheNamespace = util.format('%s.%s', self.getConfig('speciesName') || self.modelFactory.getModelName(), moment(doc.timestamp).format('M.D.YYYY'));
                    self.cacheData(cacheNamespace, doc, {
                        dir: path.join(process.cwd(), 'data/'),
                        type: ['json'],
                        done: function (cacheSaveErr) {
                            self.log(Debuggable.LOW, 'updated cached species props');
                            if (_options.complete) _options.complete(cacheSaveErr, doc);
                        }
                    });
                }
            });
        });
    },

    /**
     * @param {Object} whereProps
     * @param {Object} saveProps
     * @param [options]
     * @param [options.context]
     * @param {Function} [options.complete]
     */
    update: function (whereProps, saveProps, options) {
        var self = this,
            _options = _.defaults(options, {
                new: true,
                upsert: true
            }, self._config.queryOptions);

        self.log(Debuggable.LOW, "saveDB() - received post for: %s", this.dump(saveProps));
        this.exec(function () {
            self.log(Debuggable.MED, "saveDB() - executing on %s", this.dump(saveProps));

            var doc = new self.MongooseModel(saveProps),
                data = doc.toObject();

            delete data._id;
            delete data.__v;

            self.MongooseModel.findOneAndUpdate(whereProps, data, options)
                .lean()
                .exec(function (err, savedDoc) {
                    if (err) {
                        err = new DBError(err);
                        self.error(err);
                    }
                    self.log(Debuggable.HIGH, 'saved and sending db: ', savedDoc);
                    if (_options.complete) _options.complete.apply(_options.context, [err, (savedDoc) ? savedDoc : {}])
                })
        });
    },

    /**
     * @param {Object} saveProps
     * @param [options]
     * @param [options.context]
     * @param {Function} [options.complete]
     */
    create: function (saveProps, options) {
        var self = this,
            _options = _.defaults(options, self._config.queryOptions);

        self.log(Debuggable.LOW, "saveDB() - received post for: %s", this.dump(saveProps));
        this.exec(function () {
            self.log(Debuggable.MED, "saveDB() - executing on %s", this.dump(saveProps));

            var doc = new self.MongooseModel(saveProps);

            doc.save(function (err, savedDoc) {
                if (err) {
                    err = new DBError(err);
                    self.error(err);
                } else {
                    self.log(Debuggable.HIGH, 'saved and sending db: ', savedDoc);
                    var savedObj = savedDoc.toObject ? savedDoc.toObject() : savedDoc;
                }
                if (_options.complete) _options.complete.apply(_options.context, [err, (savedObj) ? savedObj : {}])
            });
        });
    }

};

_.extend(Database.prototype, Debuggable.prototype);

module.exports = Database;
