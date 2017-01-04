var _ = require('lodash'),
    util = require('util'),

    Debuggable = require('../debuggable');

/**
 * @class QueryProp
 * @param {Object[]} props
 * @param {Species} [species]
 * @returns {Object}
 * @constructor
 */
function Query(props, species) {

    var self = this,
        metaProps = ['matchStartFor', 'matchEndFor', 'ignoreCaseFor'],
        queryMetaProps = _.isArray(props) ? _.filter(props, function (propData, index) {
                return propData && _.includes(metaProps, propData.key)
            }) : _.pick(props, metaProps);

    this.metaProps = metaProps;
    this.species = species;
    this.props = props;
    this.queryMeta = _.reduce(queryMetaProps, function (collection, metaPropData, metaPropIdx) {
        collection[metaPropData.key || metaPropIdx] = self.parseArrayStr(metaPropData.val || metaPropData);
        return collection;
    }, {});
}

Query.prototype = {

    toObject: function () {
        var props = this.props,
            queryMeta = this.queryMeta,
            metaProps = this.metaProps,
            species = this.species;

        return _.reduce(_.omit(props, metaProps), function (query, propData, propIdx) {
            var propName = propData.key ? propData.key : propIdx,
                propValue = propData.key ? propData.val : propData,
                propType = (function(){
                    if (propData.valType) {
                        return propData.valType;
                    } else if(_.isDate(propValue)){
                        return 'Date'
                    } else if (_.isFinite(propValue)){
                        return 'Number';
                    } else if (_.isNumber(propValue)){
                        return 'Float';
                    } else {
                        return null;
                    }
                })(),
                queryFieldName = propName;

            if (propValue == undefined ||
                propValue == null ||
                (species && !_.find(species.getSpeciesProps(), {key: propName}))
            ) {
                // ignore invalid props
            } else {
                // continue build query
                switch (propType) {
                    case 'Number':
                        propValue = parseInt(propValue);
                        break;
                    case 'Date':
                        propValue = propValue.toISOString ? propValue.toISOString() : propValue;
                        break;
                    case 'Float':
                        propValue = parseFloat(propValue);
                        break;
                }

                switch (propName) {
                    case 'petId':
                    case 'hashId':
                    case '_id':
                        // only use given id and quit early
                        query = {
                            petId: propValue.toString()
                        };
                        break;
                    case 'species':
                        if (_.isRegExp(propValue)){
                            query[queryFieldName] = propValue;
                        } else {
                            query[queryFieldName] = new RegExp(propValue.toString(), 'i');
                        }
                        break;
                    case 'images':
                        // ignore images
                        break;
                    default:
                        if (propType && propType.toLowerCase() == 'string' && !_.isRegExp(propValue)) {
                            var prefix = '',
                                suffix = '',
                                regexArgs = '';
                            if (queryMeta.matchStartFor && _.includes(queryMeta.matchStartFor, propName)) {
                                prefix = '^';
                            }
                            if (queryMeta.matchEndFor && _.includes(queryMeta.matchEndFor, propName)) {
                                suffix = '$';
                            }
                            if (queryMeta.ignoreCaseFor && _.includes(queryMeta.ignoreCaseFor, propName)) {
                                regexArgs = 'i';
                            }
                            if (propName == 'color' || propName == 'petName') {
                                // ignore case for color,petName searches
                                regexArgs = 'i';
                            }
                            query[queryFieldName] = new RegExp(util.format('%s%s%s', prefix, propValue.toString(), suffix), regexArgs);
                        } else {
                            query[queryFieldName] = propValue;
                        }
                        break;
                }
            }
            return query;

        }, {});
    },

    toMongoQuery: function(){
        var query = {},
            props = this.toObject();

        if (props._id || props.petId) {
            query = {
                petId: props._id || props.petId
            };
        } else if (_.keys(props).length == 0) {
            query = {}
        } else {
            query = {
                props: {
                    $all: _.reduce(props, function (propsCollection, propValue, propName) {
                        propsCollection.push({
                            $elemMatch: {
                                key: propName,
                                val: propValue
                            }
                        });
                        return propsCollection;
                    }, [])
                }
            };
        }

        return query;
    },
    parseArrayStr: function (str) {
        try {
            var _result = str
                .replace(/^\[[\'\"]?/, '')
                .replace(/[\'\"]?]$/, '')
                .replace(/[\'\"]/g, '')
                .split(',');
            return (_.isArray(_result)) ? _result : false;
        } catch (err) {

        }
        return false;
    }
};

module.exports = Query;
