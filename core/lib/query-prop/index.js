var DefaultProp = require('./prop'),
    DateProp = require('./date-prop'),
    IDProp = require('./id-prop'),
    StringArrayProp = require('./string-array-prop'),
    IntegerProp = require('./integer-prop'),
    BooleanProp = require('./boolean-prop'),
    FloatProp = require('./float-prop'),
    LocationProp = require('./location-prop');

/**
 * @class QueryProp
 * @param {Object} queryPropModel
 * @param {Object} propData
 * @param {String} propData.key
 * @param {*} propData.val
 * @param {Object} [options]
 * @param {DebugLevel} [options.debugLevel]
 * @param {String} [options.debugTag]
 * @returns {DateProp|PetIDProp|FloatProp|StringArrayProp|BooleanProp|Prop}
 * @constructor
 */
function QueryProp(queryPropModel, propData, options) {

    switch (propData.key) {
        case 'petId':
            return new IDProp(queryPropModel, propData, options);
        default:
            // proceed;
    }

    switch (propData.valType) {
        case 'Boolean':
            return new BooleanProp(queryPropModel, propData, options);
        case '[Image]':
        case '[String]':
            return new StringArrayProp(queryPropModel, propData, options);
        case 'Location':
        case 'Float':
        case 'Number':
            return new FloatProp(queryPropModel, propData, options);
        case 'Date':
            return new DateProp(queryPropModel, propData, options);
        default:
            return new DefaultProp(queryPropModel, propData, options);
    }
}

module.exports = QueryProp;
