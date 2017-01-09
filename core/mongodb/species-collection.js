var _ = require('lodash'),

    Debuggable = require('../lib/debuggable'),
    config = require('../config'),

    TimestampedDatabase = require('./timestamped'),
    SpeciesCollectionSchema = require('./schemas/species-collection'),
    Collection = require('./lib/collection');

/**
 *
 * @extends TimestampedDatabase
 * @param options
 * @constructor
 */
function SpeciesCollectionDatabase(options) {
    var self = this,
        _options = _.defaults(options, {
            modelNamePrefix: config.DEVELOPMENT_ENV ? 'dev_' : 'prod_'
        });

    this.collection = new Collection(_options.collectionNamePrefix + 'species_collection', SpeciesCollectionSchema);
    this.collection.setDebugTag(_options.debugTag);
    this.collection.setDebugLevel(_options.debugLevel);

    TimestampedDatabase.call(this, this.collection);
}

SpeciesCollectionDatabase.prototype = {};

_.defaults(SpeciesCollectionDatabase.prototype, TimestampedDatabase.prototype);

module.exports = SpeciesCollectionDatabase;
