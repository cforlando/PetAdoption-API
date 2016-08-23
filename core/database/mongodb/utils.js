var _ = require('lodash'),
    
    config = require('../../config');

module.exports = {
    escapeRegExp: function (str) {
      return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
    },
    isValidID: function(petId){
        return /^[0-9a-fA-F]{24}$/.test(petId)
    }
};
