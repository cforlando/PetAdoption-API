var _ = require('lodash');

var config = require('../config');

var Collection = require('./lib/collection');
var TimestampedDatabase = require('./lib/timestamped-database');
var SpeciesCollectionSchema = require('./schemas/species-collection');

/**
 *
 * @extends TimestampedDatabase
 * @extends BaseDatabase
 * @class SpeciesCollectionDatabase
 * @param options
 * @constructor
 */
function SpeciesCollectionDatabase(options) {
    var _options = _.defaults(options, {
        modelNamePrefix: config.DEVELOPMENT_ENV ? 'dev_' : 'prod_'
    });
    var collection = new Collection(_options.collectionNamePrefix + 'species_collection', SpeciesCollectionSchema);

    TimestampedDatabase.call(this, collection);

    this.initDatabase();
}

SpeciesCollectionDatabase.prototype = {};

SpeciesCollectionDatabase.prototype = Object.assign({}, TimestampedDatabase.prototype, SpeciesCollectionDatabase.prototype);

module.exports = SpeciesCollectionDatabase;
