var _ = require('lodash'),
    
    config = require('../../config');

module.exports = {
    escapeRegExp: function (str) {
      return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
    }
};
