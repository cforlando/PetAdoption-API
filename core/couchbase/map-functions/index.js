var _ = require('lodash');

var sortables = [{'species': true}, {'petName': true}],
    mapFunctions = buildMapFunctions(sortables);

function formatIndexName(indexName) {
    return _.snakeCase('by_' + indexName)
}

function buildFuncString(func, index) {
    return func.toString().replace(/index/g, '\'' + index + '\'')
}

function buildMapFunctions(props) {
    return _.map(props, function (val, index) {
        var indexName = formatIndexName(index),
            mapFunction = function (doc, meta) {
                if (meta.type == "json") {
                    emit(doc[index], index);
                }
            };
        return {
            name: indexName,
            text: buildFuncString(mapFunction, index)
        };
    })
}

module.exports = {
    formatIndexName: formatIndexName,
    build: buildMapFunctions,
    preBuilt: mapFunctions
};