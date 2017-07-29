var util = require('util');
var path = require("path");

var _ = require('lodash');
var moment = require('moment');

var DbError = require('./error/index');
var BaseDatabase = require('./database');

/**
 * @extends BaseDatabase
 * @class TimestampedDatabase
 * @param {Collection} collection
 * @param {Object} [options]
 * @param {MongoDbAdapter} [options.adapter]
 * @param {String} [options.collectionNamePrefix]
 * @constructor
 */
function TimestampedDatabase(collection, options) {
    BaseDatabase.call(this, collection, options);

    this.collection.addPlugin('timestamp', function (model) {

        model.pre('save', function (next) {
            this.timestamp = new Date;
            next()
        })
    });
}

TimestampedDatabase.prototype = {
    /**
     *
     * @param {Object} options
     * @param {Object} [options.context] context for complete function callback
     * @returns {Promise.<Object>}
     */
    findLatest: function (options) {
        var self = this;
        var _options = _.defaults(options, self._config.queryOptions);

        return new Promise(function (resolve, reject) {
            self.exec(function () {
                self.MongooseModel
                    .findOne({})
                    .lean()
                    .sort({
                        timestamp: -1
                    })
                    .exec(function (err, doc) {
                        if (err || !doc) {
                            err = new DbError(err || "No docs found");
                            console.error(err);
                            reject(err);
                            return;
                        }
                        // TODO fs caching should probably be removed
                        var cacheNamespace = util.format('%s.%s', self.getConfig('speciesName') || self.collection.getCollectionName(), moment(doc.timestamp).format('M.D.YYYY'));
                        self.cacheData(cacheNamespace, doc, {
                            dir: path.join(process.cwd(), 'data/'),
                            type: ['json']
                        });

                        resolve(doc)
                    });
            });
        })
    }
};

_.extend(TimestampedDatabase.prototype, BaseDatabase.prototype);

module.exports = TimestampedDatabase;
