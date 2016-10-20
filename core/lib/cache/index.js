var path = require('path'),

    _ = require('lodash');

    JSONCache = require('./methods/cache-json');

/**
 *
 * @class {Cache}
 * @returns {Cache}
 * @constructor
 */
function Cache(){

    /**
     *
     * @param {String} method options include: 'JSON'
     * @param {*} data
     * @param {Object} [options]
     * @param {String} [options.name] name of cache file (if applicable)
     * @param {String} [options.dir] absolute path to save cache file (if applicable)
     */
    this.save = function(method, data, options){
        var _options = _.defaults(options, {
            name : 'cache',
            dir : path.join(process.cwd(), '/data')
        });

        switch (method) {
            case 'json':
                var jsonCache = new JSONCache();
                jsonCache.save(data, {
                    name: _options.name,
                    dir: _options.dir,
                    done: _options.done
                });
                break;
            default:
                throw new Error('Invalid Cache Method used');
                break;
        }
    };

    this.cache = this.save;
    return this;
}

module.exports = Cache;
