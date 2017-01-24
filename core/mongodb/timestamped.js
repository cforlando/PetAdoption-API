var util = require('util'),
    path = require("path"),

    _ = require('lodash'),
    moment = require('moment'),

    Debuggable = require('../lib/debuggable'),

    DBError = require('./lib/error'),
    Database = require('./default');

/**
 * @extends Database
 * @class TimestampedDatabase
 * @param {Collection} collection
 * @param {Object} [options]
 * @param {MongoDBAdapter} [options.adapter]
 * @param {String} [options.collectionNamePrefix]
 * @param {DebugLevel} [options.debugLevel]
 * @param {String} [options.debugTag]
 * @constructor
 */
function TimestampedDatabase(collection, options) {

    this.collection = collection;

    /**
     * @var {Collection} collection
     * @memberOf Database
     */
    this.collection.addPlugin('timestamp', function (schema) {

        schema.pre('save', function (next) {
            this.timestamp = new Date;
            next()
        })
    });

    Database.call(this, this.collection, options);
}

TimestampedDatabase.prototype = {
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
            self.MongooseModel
                .findOne({})
                .lean()
                .sort({
                    timestamp: -1
                })
                .exec(function (err, doc) {
                    if (err || !doc) {
                        err = new DBError(err || "No docs found");
                        self.error(err);
                        if (_options.complete) _options.complete(err);
                    } else {
                        // TODO fs caching should probably be removed
                        var cacheNamespace = util.format('%s.%s', self.getConfig('speciesName') || self.collection.getCollectionName(), moment(doc.timestamp).format('M.D.YYYY'));
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
    }
};

_.extend(TimestampedDatabase.prototype, Database.prototype);

module.exports = TimestampedDatabase;
