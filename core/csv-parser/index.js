
module.exports  = {
    /**
     * @callback ParsedCallback
     * @param data
     * @param options
     *
     */

    /**
     *
     * @param {Object} [options]
     * @param {ParsedCallback} options.done
     * @param {Object} options.context
     * @param {Object} options.readPath
     * @param {Object} options.writePath
     */
    parseDataset : require('./dataset').parse,

    /**
     *
     * @param {Object} [options]
     * @param {ParsedCallback} options.done
     * @param {Object} options.context
     * @param {Object} options.readPath
     * @param {Object} options.writePath
     */
    parseOptions : require('./options').parse,

    /**
     *
     * @param {Object} [options]
     * @param {ParsedCallback} options.done
     * @param {Object} options.context
     * @param {Object} options.readPath
     * @param {Object} options.writePath
     */
    parseSchema : require('./schema').parse,

    /**
     *
     * @param {Object} [options]
     * @param {ParsedCallback} options.done
     * @param {Object} options.context
     * @param {Object} options.readPath
     * @param {Object} options.writePath
     */
    parseModel : require('./model').parse
};