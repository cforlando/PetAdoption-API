var _ = require('lodash');

/**
 *
 * Provide additional status member specifiying error code
 * @class DatabaseError
 * @param {Error|String} [err]
 * @param {Number} [status]
 * @returns {Error}
 * @constructor
 */
function DatabaseError(err, status){
    var error;
    if (_.isString(err)){
       error = new Error(err);
    } else{
       error = err;
    }
    error.status = status || 404;
    return error;
}

module.exports = DatabaseError;
