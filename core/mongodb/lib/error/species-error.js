var DatabaseError = require('./db-error');
/**
 * @class SpeciesError
 * @augments {DatabaseError}
 * @returns {DatabaseError}
 * @constructor
 */
function SpeciesError(){
    return new DatabaseError("Must use valid species");
}

module.exports = SpeciesError;

