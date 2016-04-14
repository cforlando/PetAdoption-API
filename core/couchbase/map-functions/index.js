var util = require('util'),

    _ = require('lodash');

var sortables = {'species': true, 'petName': true},
    mapFunctions = buildMapFunctions(sortables);

function formatIndexName(indexName) {
    return _.snakeCase('by_' + indexName)
}

function buildFuncString(func, index) {
    return func.toString().replace(/index/g, '\'' + index + '\'')
}

function buildMapFunctions(props) {
    var funcs = _.map(props, function (val, index) {
        var indexName = formatIndexName(index),
            mapFunction = function (doc, meta) {
                if (meta.type == "json") {
                    emit(doc[index], doc);
                }
            };
        return {
            orginalName: index,
            name: indexName,
            text: buildFuncString(mapFunction, index),
            reduceText : buildFuncString( function(key, values, rereduce){
                var _data = {};
                for(var prop in values) {
                    _data[prop] = _data[prop] || [];
                    _data[prop].keys = _data[prop].keys || [];
                    _data[prop].push(values[prop]);
                    if(key) _data[prop].keys.push(key[prop]);
                }
                return _data;
            }, index)
        };
    });

    funcs.push({
        name: 'by_all',
        text: util.format(
            "function(doc, meta){" +
            "emit([%s],doc)" +
            "}", _.map(props, function (val, index) {
                return util.format("doc[\'%s\']", index);
            }))
    });

    return funcs;
}

module.exports = {
    formatIndexName: formatIndexName,
    build: buildMapFunctions,
    preBuilt: mapFunctions
};