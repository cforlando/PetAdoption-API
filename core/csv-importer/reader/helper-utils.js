var fs = require('fs'),
    
    _ = require('lodash'),
    request = require('request');

module.exports = {
    /**
     * 
     * @param {String} filePath
     * @param {Function} callback
     * @param {Object} [options]
     * @param {Object} [options.context]
     */
    download : function(filePath, callback, options){
        var _options = _.defaults(options, {});
        if (filePath.match(/^http/)) {
            request({
                method: 'GET',
                uri: filePath
            }, function (err, response, body) {
                callback.apply(_options.context, [err, body]);
            });
        } else {
            fs.readFile(filePath, {encoding: 'utf8'}, function (err, fileContent) {
                callback.apply(_options.context, [err, fileContent]);
            });
        }
    },
    getTypeFromPath: function (data) {
        var types = ['bird', 'cat', 'dog', 'rabbit', 'reptile', 'small animal'],
            result = 'default';
        _.forEach(types, function (type, index, collection) {
            var typeRegex = new RegExp(type, 'ig');
            if (typeRegex.test(data)) {
                result = _.camelCase(type);
                return false;
            }
        });

        return result;
    }
};