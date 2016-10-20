var fs = require('fs'),
    path = require('path'),
    util = require('util'),

    _ = require('lodash');

/**
 * @class JSONCache
 * @constructor
 */
function JSONCache(){

    /**
     *
     * @param {*} data
     * @param [options]
     * @param [options.dir] absolute path directory to save JSON file
     * @param [options.name] the name of the JSON file
     */
    this.save = function(data, options){
        var _options = _.defaults(options, {
            dir : path.resolve(process.cwd(), '/data'),
            name : 'cache'
        }),
            filename = util.format('%s.json', _options.name),
            content = JSON.stringify(data);

        if (_options.done){
            fs.writeFile(path.join(_options.dir, filename), content, function(err){
                _options.done(err);
            });
        } else{
            fs.writeFileSync(path.join(_options.dir, filename), content);
        }

    }
}

module.exports = JSONCache;