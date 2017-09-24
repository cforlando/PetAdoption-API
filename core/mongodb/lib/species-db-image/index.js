/**
 *
 * @class SpeciesDbImage
 * @param {String} speciesName
 * @param {Object[]} [animals]
 * @param {Object} [speciesProps]
 * @constructor
 */
function SpeciesDbImage(speciesName, animals, speciesProps) {
    this.speciesName = speciesName;
    this.animals = animals || [];
    this.speciesProps = speciesProps || {};


    return this;
}

SpeciesDbImage.prototype = {

    getSpeciesName: function () {
        return this.speciesName;
    },

    getSpeciesProps: function () {
        return this.speciesProps;
    },

    getAnimals: function () {
        return this.animals;
    }
};

module.exports = SpeciesDbImage;
