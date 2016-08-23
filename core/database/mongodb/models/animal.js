var util = require('util'),

    _ = require('lodash'),

    config = require('../../../config'),
    dbUtils = require('../utils'),

    Species = require('./species');

function Animal() {
    return Species.apply(this, arguments);
}
Animal.prototype = Object.create(Species.prototype);

Animal.prototype.formatPropType = function (propType, metaData) {
    if (metaData.isArray) {
        return [propType];
    } else if (metaData.isLoc) {
        return {
            type: [Number],
            index: '2dsphere'
        }
    } else {
        return propType;
    }
};

Animal.prototype.middleware = {
    post: {
        findOneAndUpdate: function (doc, next) {
            doc.petId = doc._id;
            doc.save(function (err, savedDoc) {
                    if (err) console.error(err);
                    next(err)
                }
            );
        }
    }
}
;

module.exports = Animal;
