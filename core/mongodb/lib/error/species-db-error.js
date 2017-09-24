var DatabaseError = require('./db-error');
/**
 * @class SpeciesDbError
 * @augments {DatabaseError}
 * @returns {DatabaseError}
 * @constructor
 */
function SpeciesDbError() {
    return new DatabaseError("Must use valid species");
}

module.exports = SpeciesDbError;

