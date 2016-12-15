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
 * @param {ModelFactory} modelFactory
 * @param {Object} [options]
 * @param {MongoDBAdapter} [options.adapter]
 * @param {String} [options.modelNamePrefix]
 * @param {DebugLevel} [options.debugLevel]
 * @param {String} [options.debugTag]
 * @constructor
 */
function TimestampedDatabase(modelFactory, options) {

    var self = this;

    this.modelFactory = modelFactory;

    /**
     * @var {ModelFactory} modelFactory
     * @memberOf Database
     */
    this.modelFactory.addPlugin('timestamp', function (schema) {

        schema.pre('save', function (next) {
            this.timestamp = new Date;
            next()
        })
    });

    this.modelFactory.addStaticMethod('getLatest', function (callback) {
        self.log(Debuggable.LOW, 'getting latest model for %s', self.modelFactory.getModelName());
        var TimestampedMongooseModel = this.model(self.modelFactory.getModelName());

        TimestampedMongooseModel.findOne({})
            .lean()
            .sort({
                timestamp: -1
            })
            .exec(function (err, latestModel) {
                if (err) {
                    callback(err)
                } else if (!latestModel) {
                    callback(new Error('Model collection is empty()'));
                } else {
                    callback(null, latestModel);
                }
            })
    });

    Database.call(this, this.modelFactory, options);
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
    }
};

_.extend(TimestampedDatabase.prototype, Database.prototype);

module.exports = TimestampedDatabase;
