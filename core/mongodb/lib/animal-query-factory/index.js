var util = require('util'),

    _ = require('lodash'),

    Prop = require('./../../../lib/prop'),
    Debuggable = require('../../../lib/debuggable/index');

/**
 * @extends Debuggable
 * @class AnimalQueryFactory
 * @param {Object} speciesProps
 * @param {Object} queryProps
 * @param {Object} [options]
 * @param {Number} [options.debugLevel]
 * @returns {AnimalQueryFactory}
 */
function AnimalQueryFactory(speciesProps, queryProps, options) {
    var self = this,
        _options = _.defaults(options, {
            debugLevel: Debuggable.PROD,
            debugTag: 'AnimalQueryFactory: '
        });


    this.setDebugLevel(_options.debugLevel);
    this.setDebugTag(_options.debugTag);

    this.speciesData = speciesProps;
    this.metaProps = {
        matchStartFor: queryProps['matchStartFor'],
        matchEndFor: queryProps['matchEndFor'],
        ignoreCaseFor: queryProps['ignoreCaseFor']
    };
    var searchableProps = _.pick(queryProps, this.speciesData.map(function (propData) {
        return propData.key
    }));
    this.log(Debuggable.MED, 'received searchable props: %s', this.dump(searchableProps));
    this.log(Debuggable.HIGH, 'AnimalQueryFactory initialized with speciesData: %s', this.dump(this.speciesData));
    this.props = _.reduce(searchableProps, function (propCollection, queryPropValue, queryPropName) {
        // pass additional species prop data (namely key so that the valType can be determined)
        var propData = _.defaults({val: queryPropValue}, _.find(self.speciesData, {key: queryPropName}));
        self.log(Debuggable.MED, "Creating prop for with {%s: %s}", queryPropName, self.dump(propData));
        propCollection[queryPropName] = new Prop(self.speciesData, propData, {
            debugLevel: self.getDebugLevel()
        });
        return propCollection;
    }, {});

    return this;
}

AnimalQueryFactory.prototype = {
    /**
     * Builds search object from provided speciesProps object. speciesProps is an object of fields corresponding to one of the animal schemas
     * @returns {Object}
     * @private
     */
    _buildQuery: function () {
        var self = this,
            query = {};

        this.log(Debuggable.MED, 'building query with props: %s', this.dump(this.props));
        this.log(Debuggable.TMI, 'building query with: %s', this.dump());

        _.forEach(this.props, function (prop) {
            var propName = prop.getName(),
                propValue = prop.getValue();

            // only process valid props
            if (prop.isValid() && _.find(self.speciesData, {key: prop.getName()})) {
                self.log(Debuggable.HIGH, 'parsing %s', propName);

                //build query
                switch (propName) {
                    case 'petId':
                    case 'hashId':
                    case '_id':
                        // only use given id and quit early
                        query = {
                            _id: propValue
                        };
                        self.log(Debuggable.LOW, 'searching by id: %s', propValue);
                        return false;
                    case 'species':
                        query[propName] = new RegExp(prop.getRegex(), 'i');
                        break;
                    case 'images':
                        // ignore images
                        break;
                    default:
                        if (prop.getType().toLowerCase() == 'string') {
                            var prefix = '',
                                suffix = '',
                                regexArgs = '';
                            if (self.metaProps.matchStartFor && _.includes(self.metaProps.matchStartFor, propName)) {
                                prefix = '^';
                            }
                            if (self.metaProps.matchEndFor && _.includes(self.metaProps.matchEndFor, propName)) {
                                suffix = '$';
                            }
                            if (self.metaProps.ignoreCaseFor && _.includes(self.metaProps.ignoreCaseFor, propName)) {
                                regexArgs = 'i';
                            }
                            if (propName == 'color' || propName == 'petName') {
                                // ignore case for color,petName searches
                                regexArgs = 'i';
                            }
                            query[propName] = new RegExp(util.format('%s%s%s', prefix, prop.getRegex(), suffix), regexArgs);
                        } else {
                            query[propName] = propValue;
                        }
                        break;
                }
            }

        });

        this.log(Debuggable.LOW, 'built query: %s', this.dump(query));
        return query;
    },

    /**
     * Returns An object that can be used for Mongoose.Model queries
     * @returns {Object}
     */
    build: function () {
        return this._buildQuery();
    }
};

_.extend(AnimalQueryFactory.prototype, Debuggable.prototype);

AnimalQueryFactory.Prop = Prop;

module.exports = AnimalQueryFactory;
