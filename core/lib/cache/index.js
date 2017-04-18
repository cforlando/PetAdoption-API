var path = require('path'),

    _ = require('lodash');

JSONCache = require('./methods/cache-json');

/**
 *
 * @class {Cache}
 * @returns {Cache}
 * @constructor
 */
function Cache() {
    // alias save method as cahce
    this.cache = this.save;
}

Cache.prototype = {

    /**
     *
     * @param {String} method options include: 'json'
     * @param {*} data
     * @param {Object} [options]
     * @param {String} [options.name] name of cache file (if applicable)
     * @param {String} [options.dir] absolute path to save cache file (if applicable)
     * @param {Function} [options.done]
     */
    save: function (method, data, options) {
        var _options = _.defaults(options, {
            name: 'cache',
            dir: path.join(process.cwd(), '/data')
        });

        switch (method) {
            case 'json':
                var jsonCache = new JSONCache();
                var jsonSaveOptions = {
                    name: _options.name,
                    dir: _options.dir
                };
                return jsonCache.save(data, jsonSaveOptions);
            default:
                return Promise.reject(new Error('invalid save option (' + method + ')selected'));
        }
    }
}

module.exports = Cache;
