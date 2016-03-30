var _ = require('lodash');

function sanitizeField(key, value, options){
    var _options = _.extend({
        schema : 'dog'
    }, options)
    
}

module.exports = {
    sanitize : sanitizeField
};