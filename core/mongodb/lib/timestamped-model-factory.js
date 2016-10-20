var _ = require('lodash'),

    Debuggable = require('../../lib/debuggable/index'),
    ModelFactory = require('./model-factory');

/**
 *
 * @extends ModelFactory
 * @class TimestampedModelFactory
 * @param {String} modelName
 * @param {Object} schema
 * @param {Object} [options]
 * @param {Object} [options.debugLevel]
 * @param {String} [options.debugTag]
 * @returns {TimestampedModelFactory}
 * @constructor
 */
function TimestampedModelFactory(modelName, schema, options) {
    var self = this,
        _options = _.defaults(options, {
            debugLevel: Debuggable.PROD,
            debugTag: 'TimestampedModelFactory: '
        });

    this.setModelName(modelName);
    this.setDebugTag(_options.debugTag);
    this.setDebugLevel(_options.debugLevel);

    for (var propName in schema) {
        if (schema.hasOwnProperty(propName)) {
            var propData = schema[propName],
                propValueSchemaType = (propData && _.isString(propData.valType)) ? this.getPropValueSchemaType(propName) : propData;
            this.addSchemaProp(propName, propValueSchemaType);
        }
    }


    this.addPlugin('timestamp', function (schema) {

        schema.pre('save', function (next) {
            this.timestamp = new Date;
            next()
        })
    });

    this.addStaticMethod('getLatest', function (callback) {
        self.log(Debuggable.LOW, 'getting latest model for %s', self.getModelName());
        var TimestampedMongooseModel = this.model(self.getModelName());

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

    return this;
}

TimestampedModelFactory.prototype = _.extend({}, ModelFactory.prototype);

module.exports = TimestampedModelFactory;
