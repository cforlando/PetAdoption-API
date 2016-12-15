var _ = require('lodash'),

    Debuggable = require('../lib/debuggable'),

    TimestampedDatabase = require('./timestamped'),
    SpeciesCollectionSchema = require('./schemas/species-collection'),
    ModelFactory = require('./lib/model-factory');

/**
 *
 * @extends TimestampedDatabase
 * @param options
 * @constructor
 */
function SpeciesCollectionDatabase(options) {
    var self = this,
        _options = _.defaults(options, {
            modelNamePrefix: 'species_collection'
        });

    this._model = new ModelFactory('species_collection', SpeciesCollectionSchema);
    this._model.setDebugTag(_options.debugTag);
    this._model.setDebugLevel(_options.debugLevel);

    TimestampedDatabase.call(this, this._model);
}

SpeciesCollectionDatabase.prototype = {};

_.defaults(SpeciesCollectionDatabase.prototype, TimestampedDatabase.prototype);

module.exports = SpeciesCollectionDatabase;
