var fs = require('fs'),
    path = require('path'),

    _ = require('lodash'),
    couchbase = require('couchbase'),

    cluster = require('./cluster'),
    mapFunctions = require('./map-functions'),

    defaultBucket = cluster.openBucket('default'),
    defaultBucketManager = defaultBucket.manager(),
    config = {
        docMap: {
            location: path.resolve(__dirname, 'map.json')
        },
        designMap: {
            location: path.resolve(__dirname, 'designDoc.json')
        }
    },
    jsonMapStr = (function(){
        try {
            return fs.readFileSync(config.docMap.location, {encoding: 'utf8'})
        } catch(err){
            return "{}";
        }
    })(),
    jsonMap = JSON.parse(jsonMapStr),
    activeDesignDocName = "dev_v1";

function buildHash(animalProps) {
    return (require('crypto').createHash('md5').update(JSON.stringify(animalProps)).digest("hex"));
}

var petAdoptionDB = {

    _buildHash: buildHash,
    /**
     *
     * @param animalProps
     * @param {Object} options
     * @param {Boolean} options.debug Whether to log debug info
     * @param {Function} options.complete callback on operation completion
     * @param {Object} options.context context for complete function callback
     */
    saveAnimal: function (animalProps, options) {
        var _options = _.extend({}, options),
            animalHash = animalProps['hashId']|| buildHash(animalProps);

        jsonMap[animalHash] = animalProps;
        animalProps['hashId'] = animalHash;

        /**
         * helper function to handle errors
         * @param {Error} err
         * @returns {*}
         */
        function onError(err) {
            if (_options.complete) {
                return _options.complete.apply(_options.context, [err, animalProps]);
            } else {
                throw err;
            }
        }


        /**
         * Helper function that caches data to a local json
         * @param {String} saveLocation
         * @param {Object} data
         * @param {Function} callback
         */
        function cacheToJSON(saveLocation, data, callback) {
            fs.writeFile(saveLocation, JSON.stringify(data), {encoding: 'utf8'}, function (err) {
                if (err) return onError(err);
                callback.apply();
            })
        }

        cacheToJSON(config.docMap.location, jsonMap, function () {

            defaultBucket.upsert(animalHash, animalProps, function (err, result) {
                if (err) return onError(err);

                // create new design doc from new animal
                var designDoc = {
                    views: {}
                };

                // assign properties to design doc
                _.forEach(mapFunctions.build(animalProps), function (func, index, collection) {
                    designDoc.views[func.name] = {
                        map: func.text
                    };
                });

                cacheToJSON(config.designMap.location, designDoc, function () {

                    // save newly created design doc
                    defaultBucketManager.upsertDesignDocument(activeDesignDocName, designDoc, function (err) {
                        if (err) return onError(err);
                        _options.complete.apply(_options.context, [err, animalProps]);
                    });
                });
            })
        });
    },

    /**
     *
     * @param animalProps
     * @param {Object} options
     * @param {Boolean} options.debug Whether to log debug info
     * @param {Function} options.complete callback on operation completion
     * @param {Object} options.context context for complete function callback
     */
    findAnimals: function (animalProps, options) {
        var _options = _.extend({}, options),
            ViewQuery = couchbase.ViewQuery,
            viewName,
            queriedKey;

        var isViewNameValid = false;
        for (var prop in animalProps) {
            if (animalProps.hasOwnProperty(prop)) {
                if (isViewNameValid) {
                    break;
                } else {
                    queriedKey = animalProps[prop];
                    viewName = mapFunctions.formatIndexName(prop);
                    switch (viewName) {
                        case 'by_pet_name':
                        case 'by_species':
                        case 'by_intake_date':
                            isViewNameValid = true;
                            break;
                        default:
                            break;
                    }
                    if(isViewNameValid) break;
                }
            }
            // use petName by default
            viewName = 'by_species'
        }

        var query = ViewQuery.from(activeDesignDocName, viewName).key(queriedKey);
        defaultBucket.query(query, function (err, results) {
            if (_options.complete) _options.complete.apply(_options.context, [null, results]);
        });
    }
};


module.exports = petAdoptionDB;