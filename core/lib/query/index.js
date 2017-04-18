var _ = require('lodash');

/**
 * @class QueryProp
 * @param {Object[]} props
 * @param {Species} [species]
 * @returns {Object}
 * @constructor
 */
function Query(props, species) {

    var self = this;
    var metaPropNames = ['matchStartFor', 'matchEndFor', 'ignoreCase', 'ignoreCaseFor', 'properties'];
    var rawQueryMetaProps = _.isArray(props) ? _.filter(props, function (propData, index) {
        return propData && _.includes(metaPropNames, propData.key)
    }) : _.pick(props, metaPropNames);

    this.metaPropNames = metaPropNames;
    this.species = species;
    this.props = props;
    this.queryMeta = _.reduce(rawQueryMetaProps, function (queryMetaProps, metaPropValue, metaPropName) {
        queryMetaProps[metaPropName] = self.parseArrayStr(metaPropValue);
        return queryMetaProps;
    }, {});
}

Query.prototype = {

    toObject: function () {
        return _.omit(this.props, this.metaPropNames);
    },

    toFormattedObject: function () {
        var self = this;
        return _.reduce(this.toObject(), function (collection, propData, propIdx) {
            var propName = propData.key ? propData.key : propIdx;
            var propValue = propData.key ? propData.val : propData;
            var propType = self.getPropType(propName, propData);
            var speciesProp = {};

            if (self.species) {
                speciesProp = _.find(self.species.getSpeciesProps(), {key: propName});
            }

            switch (propType) {
                case 'Boolean':
                    propValue = /^\s*(y|yes|true)\s*$/i.test(propValue);
                    break;
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

            collection[propName] = _.defaults({
                key: propName,
                valType: propType,
                val: propValue
            }, speciesProp);

            return collection;
        }, {});
    },

    toMongoQuery: function () {
        var self = this,
            query = {},
            queryMeta = this.queryMeta,
            props = _.reduce(this.toFormattedObject(), function (mongoQueryProps, propData) {
                var propValue = propData.val,
                    propName = propData.key;

                switch (propName) {
                    case 'petId':
                    case 'hashId':
                    case '_id':
                        // only use given id and quit early
                        mongoQueryProps = {
                            petId: propValue.toString()
                        };
                        break;
                    case 'species':
                        if (_.isRegExp(propValue)) {
                            mongoQueryProps[propName] = propValue;
                        } else {
                            mongoQueryProps[propName] = new RegExp(propValue.toString(), 'i');
                        }
                        break;
                    case 'images':
                        // ignore images
                        break;
                    default:

                        if (self.isPropRegex(propData)) {
                            var prefix = '',
                                suffix = '',
                                regexArgs = '';
                            if (queryMeta.matchStartFor && _.includes(queryMeta.matchStartFor, propName)) {
                                prefix = '^';
                            }
                            if (queryMeta.matchEndFor && _.includes(queryMeta.matchEndFor, propName)) {
                                suffix = '$';
                            }
                            if (queryMeta.ignoreCase && _.includes(queryMeta.ignoreCase, propName)
                                || queryMeta.ignoreCaseFor && _.includes(queryMeta.ignoreCaseFor, propName)) {
                                regexArgs = 'i';
                            }
                            if (propName == 'color' || propName == 'petName') {
                                // ignore case for color,petName searches
                                regexArgs = 'i';
                            }
                            mongoQueryProps[propName] = new RegExp(prefix + self.escapeRegExp(propValue) + suffix, regexArgs);
                        } else {
                            mongoQueryProps[propName] = propValue;
                        }
                        break;
                }
                return mongoQueryProps;
            }, {});

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

    getPropType: function (propName, propData) {
        var propValue = propData.key ? propData.val : propData;

        if (this.species && this.species.getProp(propName)) {
            return this.species.getProp(propName).valType;

        } else if (propData.valType) {
            return propData.valType;

        } else if (_.isDate(propValue)) {
            return 'Date'

        } else if (_.isFinite(propValue)) {
            return 'Number';

        } else if (_.isNumber(propValue)) {
            return 'Float';

        } else if (propValue && /^\s*(y|yes|true|n|no|false)\s*$/i.test(propValue.toString())) {
            return 'Boolean';

        } else {
            return null;
        }
    },

    isPropRegex: function (propData) {
        var self = this,
            isString = propData.valType && propData.valType.toLowerCase() == 'string' && !_.isRegExp(propData.val),
            hasMeta = (function () {
                var result = false;
                _.forEach(self.queryMeta, function (queryMetaValue) {
                    if (_.includes(queryMetaValue, propData.key)) {
                        result = true;
                        return false;
                    }
                });
                return result;
            })();
        return isString || hasMeta;
    },

    escapeRegExp: function (str) {
        return str.toString().replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
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
