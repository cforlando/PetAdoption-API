var fs = require('mz/fs');

var _ = require('lodash');
var request = require('superagent');

module.exports = {
    /**
     *
     * @param {String} filePath
     * @returns {Promise.<String>}
     */
    download: function (filePath, options) {
        var opts = _.defaults(options, {});

        if (filePath.match(/^http/)) {
            return request.get(filePath)
                .then(function (response) {
                    return response.body;
                });
        }

        return fs.readFile(filePath, 'utf8')
            .catch(function (err) {
                console.error(err)
            });
    },

    /**
     * generates speciesName accoring to a full file path
     * @param fileFullPath
     * @returns {string}
     */
    getSpeciesNameFromPath: function (fileFullPath) {
        var speciesNames = ['bird', 'cat', 'dog', 'rabbit', 'reptile', 'small animal'];
        var result = 'default';

        _.forEach(speciesNames, function (speciesName) {
            var typeRegex = new RegExp(speciesName, 'ig');
            if (typeRegex.test(fileFullPath)) {
                result = _.camelCase(speciesName);
                // quit early
                return false;
            }
        });

        return result;
    }
};