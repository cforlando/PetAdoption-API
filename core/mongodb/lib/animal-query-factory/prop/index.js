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
 * @param {Object} queryModel
 * @param {Object} propData
 * @param {String} propData.key
 * @param {*} propData.val
 * @param {Object} [options]
 * @param {DebugLevel} [options.debugLevel]
 * @param {String} [options.debugTag]
 * @returns {DateProp|PetIDProp|FloatProp|StringArrayProp|BooleanProp|Prop}
 * @constructor
 */
function QueryProp(queryModel, propData, options) {

    switch (propData.key) {
        case 'petId':
            return new IDProp(queryModel, propData, options);
        default:
            // proceed;
    }

    switch (propData.valType) {
        case 'Boolean':
            return new BooleanProp(queryModel, propData, options);
        case '[Image]':
        case '[String]':
            return new StringArrayProp(queryModel, propData, options);
        case 'Location':
        case 'Float':
        case 'Number':
            return new FloatProp(queryModel, propData, options);
        case 'Date':
            return new DateProp(queryModel, propData, options);
        default:
            return new DefaultProp(queryModel, propData, options);
    }
}

module.exports = QueryProp;
